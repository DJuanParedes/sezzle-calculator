package httpapi

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
)

func TestAPI(t *testing.T) {
	tests := []struct {
		name, method, path, body, contentType string
		status                                int
		code                                  string
	}{
		{"success", "POST", "/api/calculate", `{"operation":"add","operands":[2,3]}`, "application/json", 200, ""},
		{"charset", "POST", "/api/calculate", `{"operation":"sqrt","operands":[9]}`, "application/json; charset=utf-8", 200, ""},
		{"health", "GET", "/api/health", "", "", 200, ""},
		{"health wrong method", "POST", "/api/health", "", "", 405, "method_not_allowed"},
		{"not found", "GET", "/api/unknown", "", "", 404, "not_found"},
		{"wrong method", "GET", "/api/calculate", "", "", 405, "method_not_allowed"},
		{"wrong media", "POST", "/api/calculate", "{}", "text/plain", 415, "unsupported_media_type"},
		{"missing media", "POST", "/api/calculate", "{}", "", 415, "unsupported_media_type"},
		{"broken JSON", "POST", "/api/calculate", "{", "application/json", 400, "invalid_json"},
		{"empty", "POST", "/api/calculate", "", "application/json", 400, "invalid_json"},
		{"array", "POST", "/api/calculate", "[]", "application/json", 400, "invalid_json"},
		{"null body", "POST", "/api/calculate", "null", "application/json", 400, "invalid_operation"},
		{"string number", "POST", "/api/calculate", `{"operation":"add","operands":["1",2]}`, "application/json", 400, "invalid_json"},
		{"null operand", "POST", "/api/calculate", `{"operation":"add","operands":[null,2]}`, "application/json", 400, "invalid_operands"},
		{"null operands", "POST", "/api/calculate", `{"operation":"add","operands":null}`, "application/json", 400, "invalid_operands"},
		{"unknown field", "POST", "/api/calculate", `{"operation":"add","operands":[1,2],"extra":true}`, "application/json", 400, "invalid_json"},
		{"trailing object", "POST", "/api/calculate", `{"operation":"add","operands":[1,2]} {}`, "application/json", 400, "invalid_json"},
		{"trailing junk", "POST", "/api/calculate", `{"operation":"add","operands":[1,2]} nope`, "application/json", 400, "invalid_json"},
		{"overflow literal", "POST", "/api/calculate", `{"operation":"add","operands":[1e999,2]}`, "application/json", 400, "invalid_json"},
		{"division zero", "POST", "/api/calculate", `{"operation":"divide","operands":[2,0]}`, "application/json", 400, "division_by_zero"},
		{"domain", "POST", "/api/calculate", `{"operation":"sqrt","operands":[-2]}`, "application/json", 400, "invalid_domain"},
		{"operation", "POST", "/api/calculate", `{"operation":"eval","operands":[1,2]}`, "application/json", 400, "invalid_operation"},
		{"arity", "POST", "/api/calculate", `{"operation":"add","operands":[1]}`, "application/json", 400, "invalid_operands"},
		{"oversized", "POST", "/api/calculate", strings.Repeat(" ", 4097), "application/json", 413, "body_too_large"},
		{"oversized trailing", "POST", "/api/calculate", `{"operation":"add","operands":[1,2]}` + strings.Repeat(" ", 4097), "application/json", 413, "body_too_large"},
	}
	handler := NewHandler()
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, tt.path, strings.NewReader(tt.body))
			if tt.contentType != "" {
				req.Header.Set("Content-Type", tt.contentType)
			}
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)
			if rec.Code != tt.status {
				t.Fatalf("got %d: %s; want %d", rec.Code, rec.Body, tt.status)
			}
			if rec.Header().Get("Content-Type") != "application/json" {
				t.Fatal("missing JSON content type")
			}
			if rec.Header().Get("Cache-Control") != "no-store" {
				t.Fatal("responses should not be cached")
			}
			if tt.status == 405 && rec.Header().Get("Allow") == "" {
				t.Fatal("missing Allow header")
			}
			var body map[string]any
			if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
				t.Fatal(err)
			}
			if tt.code != "" && body["error"].(map[string]any)["code"] != tt.code {
				t.Fatalf("wrong error: %v", body)
			}
			if tt.name == "success" && body["result"] != float64(5) {
				t.Fatalf("wrong result: %v", body)
			}
		})
	}
}
func TestConcurrentRequests(t *testing.T) {
	handler := NewHandler()
	var wg sync.WaitGroup
	for i := 0; i < 30; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			req := httptest.NewRequest(http.MethodPost, "/api/calculate", strings.NewReader(`{"operation":"multiply","operands":[6,7]}`))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)
			if rec.Code != 200 || !strings.Contains(rec.Body.String(), `"result":42`) {
				t.Errorf("unexpected response: %s", rec.Body)
			}
		}()
	}
	wg.Wait()
}
