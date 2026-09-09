import type { Calculation } from "./calculator";

export async function calculate(
  input: Calculation | { expression: string; angleMode: "deg" | "rad" },
  signal?: AbortSignal,
): Promise<number> {
  const response = await fetch(
    "expression" in input ? "/api/evaluate" : "/api/calculate",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal,
    },
  );
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "The server returned an unreadable response. Please try again.",
    );
  }
  if (!response.ok) {
    const message = (data as { error?: { message?: unknown } } | null)?.error
      ?.message;
    throw new Error(
      typeof message === "string"
        ? message
        : "The calculation failed. Please try again.",
    );
  }
  if (
    typeof data !== "object" ||
    data === null ||
    !("result" in data) ||
    typeof data.result !== "number" ||
    !Number.isFinite(data.result)
  ) {
    throw new Error("The server returned an invalid result. Please try again.");
  }
  return data.result;
}
