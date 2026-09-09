package httpapi

import (
	"net/http/httptest"
	"strings"
	"testing"
)

func TestScientificEndpoint(t *testing.T) {
	for _, tc := range []struct {
		body     string
		status   int
		contains string
	}{
		{`{"expression":"sin(30)+sqrt(9)","angleMode":"deg"}`, 200, `"result":3.5`},
		{`{"expression":"1/0","angleMode":"rad"}`, 400, "invalid_expression"},
		{`{"expression":"1","angleMode":"bad"}`, 400, "invalid_expression"},
		{`{"expression":1}`, 400, "invalid_json"},
		{`{"expression":"1","angleMode":"deg","extra":1}`, 400, "invalid_json"},
		{`{} {}`, 400, "invalid_json"}, {`null`, 400, "invalid_expression"},
	} {
		t.Run(tc.body, func(t *testing.T) {
			req := httptest.NewRequest("POST", "/api/evaluate", strings.NewReader(tc.body))
			req.Header.Set("Content-Type", "application/json")
			res := httptest.NewRecorder()
			NewHandler().ServeHTTP(res, req)
			if res.Code != tc.status || !strings.Contains(res.Body.String(), tc.contains) {
				t.Fatalf("%d %s", res.Code, res.Body.String())
			}
		})
	}
}
