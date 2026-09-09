package calculator

import (
	"errors"
	"math"
	"testing"
)

func TestCalculate(t *testing.T) {
	tests := []struct {
		name, op string
		values   []float64
		want     float64
	}{
		{"addition", "add", []float64{2, 3}, 5},
		{"negative addition", "add", []float64{-2, 3}, 1},
		{"subtraction", "subtract", []float64{2, 3}, -1},
		{"multiply decimals", "multiply", []float64{1.5, 2}, 3},
		{"division", "divide", []float64{7, 2}, 3.5},
		{"power", "power", []float64{2, 10}, 1024},
		{"negative exponent", "power", []float64{2, -2}, .25},
		{"negative base", "power", []float64{-2, 3}, -8},
		{"sqrt", "sqrt", []float64{81}, 9},
		{"sqrt zero", "sqrt", []float64{0}, 0},
		{"percentage", "percentage", []float64{15, 200}, 30},
		{"negative percentage", "percentage", []float64{-10, 50}, -5},
		{"negative zero", "multiply", []float64{math.Copysign(0, -1), 2}, 0},
		{"decimal precision", "add", []float64{.1, .2}, .30000000000000004},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Calculate(tt.op, tt.values)
			if err != nil || got != tt.want {
				t.Fatalf("got %v, %v; want %v", got, err, tt.want)
			}
			if got == 0 && math.Signbit(got) {
				t.Fatal("negative zero was not normalized")
			}
		})
	}
}
func TestCalculateErrors(t *testing.T) {
	tests := []struct {
		name, op string
		values   []float64
		want     error
	}{
		{"unknown operation", "sum", []float64{1, 2}, ErrOperation},
		{"missing operands", "add", nil, ErrOperands},
		{"too few operands", "add", []float64{1}, ErrOperands},
		{"extra operands", "sqrt", []float64{1, 2}, ErrOperands},
		{"nan", "add", []float64{math.NaN(), 2}, ErrOperands},
		{"infinity", "add", []float64{1, math.Inf(1)}, ErrOperands},
		{"divide zero", "divide", []float64{1, 0}, ErrDivisionByZero},
		{"divide negative zero", "divide", []float64{1, math.Copysign(0, -1)}, ErrDivisionByZero},
		{"negative root", "sqrt", []float64{-1}, ErrDomain},
		{"fractional negative power", "power", []float64{-2, .5}, ErrDomain},
		{"zero power zero", "power", []float64{0, 0}, ErrDomain},
		{"zero negative exponent", "power", []float64{0, -1}, ErrDomain},
		{"overflow", "multiply", []float64{math.MaxFloat64, 2}, ErrDomain},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := Calculate(tt.op, tt.values)
			if !errors.Is(err, tt.want) {
				t.Fatalf("got %v; want %v", err, tt.want)
			}
		})
	}
}
