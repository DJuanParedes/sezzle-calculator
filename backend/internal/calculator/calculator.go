// Package calculator contains pure arithmetic, independent of HTTP and storage.
package calculator

import (
	"errors"
	"math"
)

var (
	ErrOperation      = errors.New("Choose a supported operation.")
	ErrOperands       = errors.New("Provide the correct number of finite operands.")
	ErrDivisionByZero = errors.New("Cannot divide by zero.")
	ErrDomain         = errors.New("The result is not a finite real number.")
)

// Calculate uses IEEE 754 float64 arithmetic. Percentage means a percent of b.
func Calculate(operation string, operands []float64) (float64, error) {
	count := 2
	switch operation {
	case "add", "subtract", "multiply", "divide", "power", "percentage":
	case "sqrt":
		count = 1
	default:
		return 0, ErrOperation
	}
	if len(operands) != count {
		return 0, ErrOperands
	}
	for _, x := range operands {
		if math.IsNaN(x) || math.IsInf(x, 0) {
			return 0, ErrOperands
		}
	}
	a := operands[0]
	var result float64
	switch operation {
	case "add":
		result = a + operands[1]
	case "subtract":
		result = a - operands[1]
	case "multiply":
		result = a * operands[1]
	case "divide":
		if operands[1] == 0 {
			return 0, ErrDivisionByZero
		}
		result = a / operands[1]
	case "power":
		if a == 0 && operands[1] == 0 {
			return 0, ErrDomain
		}
		result = math.Pow(a, operands[1])
	case "sqrt":
		result = math.Sqrt(a)
	case "percentage":
		result = (a / 100) * operands[1]
	}
	if math.IsNaN(result) || math.IsInf(result, 0) {
		return 0, ErrDomain
	}
	if result == 0 {
		result = 0
	} // Normalize negative zero for JSON/display.
	return result, nil
}
