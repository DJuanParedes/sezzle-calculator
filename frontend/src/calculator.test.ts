import { describe, expect, it } from "vitest";
import { expression, parseOperands } from "./calculator";
describe("parseOperands", () => {
  it.each(["", " ", "no", "Infinity", "NaN", "0x10", "1,2", "1e999", "."])(
    "rejects invalid number %j",
    (value) => {
      expect(() => parseOperands("add", value, "2")).toThrow("first value");
    },
  );
  it("rejects an invalid second operand", () =>
    expect(() => parseOperands("add", "1", "")).toThrow("second value"));
  it("accepts decimal, signed and exponent notation", () => {
    expect(parseOperands("add", " -.5 ", "+2e3")).toEqual([-0.5, 2000]);
  });
  it("accepts a unary operation without a second operand", () =>
    expect(parseOperands("sqrt", "0", "")).toEqual([0]));
  it("rejects division by negative zero", () =>
    expect(() => parseOperands("divide", "1", "-0")).toThrow("divide by zero"));
  it("rejects a negative square root", () =>
    expect(() => parseOperands("sqrt", "-1", "")).toThrow("non-negative"));
});
describe("expression", () => {
  it("formats binary expressions", () =>
    expect(expression("multiply", [3, 4])).toBe("3 × 4"));
  it("formats square roots", () =>
    expect(expression("sqrt", [9])).toBe("√(9)"));
  it("defines percentage explicitly", () =>
    expect(expression("percentage", [15, 200])).toBe("15% of 200"));
});
