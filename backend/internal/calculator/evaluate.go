package calculator

import (
	"fmt"
	"math"
	"strconv"
	"strings"
	"unicode"
)

type parser struct {
	text       string
	pos, depth int
	radians    bool
	err        error
}

func Evaluate(expression, angleMode string) (float64, error) {
	if angleMode != "deg" && angleMode != "rad" {
		return 0, fmt.Errorf("Angle mode must be deg or rad.")
	}
	if len(expression) == 0 || len(expression) > 512 {
		return 0, fmt.Errorf("Enter an expression of 1–512 characters.")
	}
	p := parser{text: expression, radians: angleMode == "rad"}
	value := p.sum()
	p.space()
	if p.err != nil {
		return 0, p.err
	}
	if p.pos != len(p.text) {
		return 0, fmt.Errorf("Unexpected input at position %d. Use * for multiplication.", p.pos+1)
	}
	if math.IsNaN(value) || math.IsInf(value, 0) {
		return 0, fmt.Errorf("The expression has no finite real result.")
	}
	if value == 0 {
		value = 0
	}
	return value, nil
}
func (p *parser) space() {
	for p.pos < len(p.text) && unicode.IsSpace(rune(p.text[p.pos])) {
		p.pos++
	}
}
func (p *parser) take(c byte) bool {
	p.space()
	if p.pos < len(p.text) && p.text[p.pos] == c {
		p.pos++
		return true
	}
	return false
}
func (p *parser) sum() (result float64) {
	defer func() { p.check(result) }()
	v := p.product()
	for p.err == nil {
		if p.take('+') {
			v += p.product()
		} else if p.take('-') {
			v -= p.product()
		} else {
			break
		}
	}
	return v
}
func (p *parser) product() (result float64) {
	defer func() { p.check(result) }()
	v := p.unary()
	for p.err == nil {
		if p.take('*') {
			v *= p.unary()
		} else if p.take('/') {
			d := p.unary()
			if d == 0 {
				p.err = ErrDivisionByZero
				return 0
			}
			v /= d
		} else {
			break
		}
	}
	return v
}
func (p *parser) unary() (result float64) {
	defer func() { p.check(result) }()
	p.depth++
	defer func() { p.depth-- }()
	if p.depth > 64 {
		p.err = fmt.Errorf("Expression nesting exceeds 64 levels.")
		return 0
	}
	if p.take('+') {
		return p.unary()
	}
	if p.take('-') {
		return -p.unary()
	}
	v := p.atom()
	for p.err == nil {
		if p.take('%') {
			v /= 100
		} else if p.take('!') {
			if v < 0 || v > 170 || math.Trunc(v) != v {
				p.err = fmt.Errorf("Factorial requires an integer from 0 to 170.")
				return 0
			}
			n := v
			v = 1
			for i := 2.0; i <= n; i++ {
				v *= i
			}
		} else {
			break
		}
	}
	if p.take('^') {
		exponent := p.unary()
		if v == 0 && exponent == 0 {
			p.err = fmt.Errorf("Zero to the power zero is undefined.")
			return 0
		}
		v = math.Pow(v, exponent)
	}
	return v
}
func (p *parser) check(value float64) {
	if p.err == nil && (math.IsNaN(value) || math.IsInf(value, 0)) {
		p.err = fmt.Errorf("The expression has no finite real result.")
	}
}
func (p *parser) atom() float64 {
	if p.take('(') {
		v := p.sum()
		if !p.take(')') {
			p.err = fmt.Errorf("Missing closing parenthesis.")
		}
		return v
	}
	p.space()
	start := p.pos
	for p.pos < len(p.text) && ((p.text[p.pos] >= 'a' && p.text[p.pos] <= 'z') || (p.text[p.pos] >= 'A' && p.text[p.pos] <= 'Z')) {
		p.pos++
	}
	if p.pos > start {
		name := strings.ToLower(p.text[start:p.pos])
		if name == "pi" {
			return math.Pi
		}
		if name == "e" {
			return math.E
		}
		if !p.take('(') {
			p.err = fmt.Errorf("Functions require parentheses.")
			return 0
		}
		v := p.sum()
		if !p.take(')') {
			p.err = fmt.Errorf("Missing closing parenthesis.")
			return 0
		}
		angle := v
		if !p.radians {
			angle *= math.Pi / 180
		}
		inverse := 1.0
		if !p.radians {
			inverse = 180 / math.Pi
		}
		switch name {
		case "sin":
			return math.Sin(angle)
		case "cos":
			return math.Cos(angle)
		case "tan":
			if math.Abs(math.Cos(angle)) < 1e-14 {
				p.err = fmt.Errorf("Tangent is undefined at this angle.")
				return 0
			}
			return math.Tan(angle)
		case "asin":
			return math.Asin(v) * inverse
		case "acos":
			return math.Acos(v) * inverse
		case "atan":
			return math.Atan(v) * inverse
		case "sqrt":
			return math.Sqrt(v)
		case "ln":
			return math.Log(v)
		case "log":
			return math.Log10(v)
		case "abs":
			return math.Abs(v)
		case "exp":
			return math.Exp(v)
		default:
			p.err = fmt.Errorf("Unknown function: %s.", name)
			return 0
		}
	}
	for p.pos < len(p.text) && ((p.text[p.pos] >= '0' && p.text[p.pos] <= '9') || p.text[p.pos] == '.') {
		p.pos++
	}
	if p.pos > start && p.pos < len(p.text) && (p.text[p.pos] == 'e' || p.text[p.pos] == 'E') {
		p.pos++
		if p.pos < len(p.text) && (p.text[p.pos] == '+' || p.text[p.pos] == '-') {
			p.pos++
		}
		for p.pos < len(p.text) && p.text[p.pos] >= '0' && p.text[p.pos] <= '9' {
			p.pos++
		}
	}
	v, err := strconv.ParseFloat(p.text[start:p.pos], 64)
	if err != nil {
		p.err = fmt.Errorf("Expected a number or function at position %d.", start+1)
	}
	return v
}
