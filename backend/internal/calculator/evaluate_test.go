package calculator

import (
	"math"
	"strings"
	"testing"
)

func TestEvaluate(t *testing.T) {
	for _, tc := range []struct {
		expr, mode string
		want       float64
	}{
		{"2+3*4", "deg", 14}, {"(2+3)*4", "deg", 20}, {"2^3^2", "deg", 512}, {"-2^2", "deg", -4}, {"2^-2", "deg", .25}, {"10-6/2", "deg", 7},
		{"sin(30)", "deg", .5}, {"cos(60)", "deg", .5}, {"tan(45)", "deg", 1}, {"sin(pi/2)", "rad", 1}, {"asin(1)", "deg", 90}, {"acos(0)", "rad", math.Pi / 2}, {"atan(1)", "deg", 45},
		{"ln(e)", "rad", 1}, {"log(1000)", "deg", 3}, {"sqrt(81)+abs(-2)", "deg", 11}, {"exp(0)", "rad", 1}, {"5!", "deg", 120}, {"0!", "deg", 1}, {"200*15%", "deg", 30}, {"+1.2e-3", "deg", .0012}, {" COS(0) + .5 ", "deg", 1.5}, {"-0", "deg", 0},
	} {
		t.Run(tc.expr+tc.mode, func(t *testing.T) {
			got, err := Evaluate(tc.expr, tc.mode)
			if err != nil || math.Abs(got-tc.want) > 1e-10 {
				t.Fatalf("got %v, %v; want %v", got, err, tc.want)
			}
		})
	}
}
func TestEvaluateErrors(t *testing.T) {
	for _, expr := range []string{"", "1/0", "0^0", "sqrt(-1)", "ln(0)", "log(-1)", "asin(2)", "tan(90)", "(-1)!", "2.5!", "171!", "unknown(2)", "sin 2", "(1+2", "sin(2", "2pi", "2+", "1..2", "1e+", "1e999", "exp(999)", "1;alert(1)", strings.Repeat("(", 65) + "1" + strings.Repeat(")", 65), strings.Repeat("1", 513)} {
		t.Run(expr, func(t *testing.T) {
			if _, err := Evaluate(expr, "deg"); err == nil {
				t.Fatal("expected error")
			}
		})
	}
	if _, err := Evaluate("1", "bad"); err == nil {
		t.Fatal("expected error")
	}
}
