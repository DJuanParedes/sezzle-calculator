package httpapi

import (
	"encoding/json"
	"errors"
	"io"
	"mime"
	"net/http"

	"sezzle-calculator/backend/internal/calculator"
)

type request struct {
	Operation string     `json:"operation"`
	Operands  []*float64 `json:"operands"`
}
type errorBody struct {
	Error struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

func respond(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
func fail(w http.ResponseWriter, status int, code, message string) {
	body := errorBody{}
	body.Error.Code, body.Error.Message = code, message
	respond(w, status, body)
}

func NewHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/health" {
			if r.Method != http.MethodGet {
				w.Header().Set("Allow", "GET")
				fail(w, 405, "method_not_allowed", "Use GET for this endpoint.")
				return
			}
			respond(w, 200, map[string]string{"status": "ok"})
			return
		}
		if r.URL.Path != "/api/calculate" && r.URL.Path != "/api/evaluate" {
			fail(w, 404, "not_found", "Endpoint not found.")
			return
		}
		if r.Method != http.MethodPost {
			w.Header().Set("Allow", "POST")
			fail(w, 405, "method_not_allowed", "Use POST for this endpoint.")
			return
		}
		mediaType, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
		if err != nil || mediaType != "application/json" {
			fail(w, 415, "unsupported_media_type", "Send Content-Type: application/json.")
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, 4096)
		decoder := json.NewDecoder(r.Body)
		decoder.DisallowUnknownFields()
		if r.URL.Path == "/api/evaluate" {
			var input struct {
				Expression string `json:"expression"`
				AngleMode  string `json:"angleMode"`
			}
			if err := decoder.Decode(&input); err != nil {
				decodeError(w, err)
				return
			}
			if err := decoder.Decode(&struct{}{}); err != io.EOF {
				decodeError(w, err)
				return
			}
			result, err := calculator.Evaluate(input.Expression, input.AngleMode)
			if err != nil {
				fail(w, 400, "invalid_expression", err.Error())
				return
			}
			respond(w, 200, map[string]float64{"result": result})
			return
		}
		var input request
		if err := decoder.Decode(&input); err != nil {
			decodeError(w, err)
			return
		}
		if err := decoder.Decode(&struct{}{}); err != io.EOF {
			decodeError(w, err)
			return
		}
		operands := make([]float64, len(input.Operands))
		for i, value := range input.Operands {
			if value == nil {
				fail(w, 400, "invalid_operands", "Operands must be JSON numbers, not null.")
				return
			}
			operands[i] = *value
		}
		result, err := calculator.Calculate(input.Operation, operands)
		if err != nil {
			code := "invalid_operands"
			switch {
			case errors.Is(err, calculator.ErrOperation):
				code = "invalid_operation"
			case errors.Is(err, calculator.ErrDivisionByZero):
				code = "division_by_zero"
			case errors.Is(err, calculator.ErrDomain):
				code = "invalid_domain"
			}
			fail(w, 400, code, err.Error())
			return
		}
		respond(w, 200, map[string]float64{"result": result})
	})
}
func decodeError(w http.ResponseWriter, err error) {
	var tooLarge *http.MaxBytesError
	if errors.As(err, &tooLarge) {
		fail(w, 413, "body_too_large", "Request body must not exceed 4096 bytes.")
	} else {
		fail(w, 400, "invalid_json", "Send one JSON object with operation and numeric operands.")
	}
}
