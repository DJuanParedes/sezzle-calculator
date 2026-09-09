import { afterEach, describe, expect, it, vi } from "vitest";
import { calculate } from "./api";
const input = { operation: "add" as const, operands: [2, 3] };
afterEach(() => vi.unstubAllGlobals());
describe("API client", () => {
  it("posts scientific expressions and angle mode", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ result: 1 }) });
    vi.stubGlobal("fetch", fetch);
    const expression = { expression: "sin(pi/2)", angleMode: "rad" as const };
    expect(await calculate(expression)).toBe(1);
    expect(fetch).toHaveBeenCalledWith(
      "/api/evaluate",
      expect.objectContaining({ body: JSON.stringify(expression) }),
    );
  });
  it("posts numeric operands and forwards the cancellation signal", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ result: 5 }) });
    vi.stubGlobal("fetch", fetch);
    const signal = new AbortController().signal;
    expect(await calculate(input, signal)).toBe(5);
    expect(fetch).toHaveBeenCalledWith("/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal,
    });
  });
  it("surfaces a structured server error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: "Cannot divide by zero." } }),
      }),
    );
    await expect(calculate(input)).rejects.toThrow("Cannot divide by zero.");
  });
  it.each([null, {}, { error: { message: 42 } }])(
    "handles unknown error shape %j",
    async (data) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, json: async () => data }),
      );
      await expect(calculate(input)).rejects.toThrow("calculation failed");
    },
  );
  it.each([null, {}, { result: "5" }, { result: Infinity }, { result: NaN }])(
    "rejects invalid success %j",
    async (data) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: true, json: async () => data }),
      );
      await expect(calculate(input)).rejects.toThrow("invalid result");
    },
  );
  it("handles a non-JSON response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => {
          throw new Error("JSON");
        },
      }),
    );
    await expect(calculate(input)).rejects.toThrow("unreadable");
  });
  it("propagates a network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    await expect(calculate(input)).rejects.toThrow("Failed to fetch");
  });
});
