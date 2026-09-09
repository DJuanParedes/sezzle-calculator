import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { calculate } from "./api";
vi.mock("./api", () => ({ calculate: vi.fn() }));
const api = vi.mocked(calculate);
afterEach(() => {
  vi.resetAllMocks();
  vi.useRealTimers();
});
async function fill(a = "24", b = "8") {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("First value"), a);
  await user.type(screen.getByLabelText("Second value"), b);
  return user;
}
describe("calculator UI", () => {
  it("starts empty and validates before making a request", async () => {
    render(<App />);
    expect(screen.getByText("Room for an answer.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Calculate" }));
    expect(screen.getByRole("alert")).toHaveTextContent("first value");
    expect(api).not.toHaveBeenCalled();
  });
  it("submits via Enter and uses the server result", async () => {
    api.mockResolvedValue(32);
    render(<App />);
    const user = await fill();
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("32"),
    );
    expect(api).toHaveBeenCalledWith(
      { operation: "add", operands: [24, 8] },
      expect.any(AbortSignal),
    );
    expect(
      screen.getByRole("region", { name: "Recent calculations" }),
    ).toHaveTextContent("24 + 8");
  });
  it("supports all operation buttons and unary square root", async () => {
    api.mockResolvedValue(3);
    render(<App />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Square root" }));
    expect(screen.queryByLabelText("Second value")).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("First value"), "9");
    await user.click(screen.getByRole("button", { name: "Calculate" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("√(9)"),
    );
    expect(api).toHaveBeenCalledWith(
      { operation: "sqrt", operands: [9] },
      expect.any(AbortSignal),
    );
    await user.click(screen.getByRole("button", { name: "Power" }));
    expect(screen.getByLabelText("Exponent")).toBeInTheDocument();
  });
  it("labels and submits percentage unambiguously", async () => {
    api.mockResolvedValue(30);
    render(<App />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Percentage" }));
    await user.type(
      screen.getByLabelText("Percentage", { selector: "input" }),
      "15",
    );
    await user.type(screen.getByLabelText("Of this number"), "200");
    await user.click(screen.getByRole("button", { name: "Calculate" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("15% of 200"),
    );
    expect(api).toHaveBeenCalledWith(
      { operation: "percentage", operands: [15, 200] },
      expect.any(AbortSignal),
    );
  });
  it("prevents division by zero without sending a request", async () => {
    render(<App />);
    const user = await fill("8", "0");
    await user.click(screen.getByRole("button", { name: "Divide" }));
    await user.click(screen.getByRole("button", { name: "Calculate" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Cannot divide by zero",
    );
    expect(api).not.toHaveBeenCalled();
  });
  it("disables editing and avoids duplicate requests while pending", async () => {
    let resolve!: (n: number) => void;
    api.mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    render(<App />);
    const user = await fill();
    await user.click(screen.getByRole("button", { name: "Calculate" }));
    expect(screen.getByLabelText("First value")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Calculating…" })).toBeDisabled();
    fireEvent.submit(
      screen.getByRole("button", { name: "Calculating…" }).closest("form")!,
    );
    expect(api).toHaveBeenCalledTimes(1);
    await act(async () => resolve(32));
    expect(screen.getByLabelText("First value")).toBeEnabled();
  });
  it("reports API errors and permits retry", async () => {
    api
      .mockRejectedValueOnce(
        new Error("The result is not a finite real number."),
      )
      .mockResolvedValueOnce(32);
    render(<App />);
    const user = await fill();
    await user.click(screen.getByRole("button", { name: "Calculate" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "finite real number",
    );
    await user.click(screen.getByRole("button", { name: "Calculate" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("32"),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("reports network failures", async () => {
    api.mockRejectedValue(new TypeError("Failed to fetch"));
    render(<App />);
    const user = await fill();
    await user.click(screen.getByRole("button", { name: "Calculate" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cannot reach the server",
    );
  });
  it("clears inputs, errors and result and restores focus", async () => {
    api.mockResolvedValue(32);
    render(<App />);
    const user = await fill();
    await user.click(screen.getByRole("button", { name: "Calculate" }));
    await screen.findByText("24 + 8", { selector: ".result-expression" });
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByLabelText("First value")).toHaveValue("");
    expect(screen.getByLabelText("Second value")).toHaveValue("");
    expect(screen.getByLabelText("First value")).toHaveFocus();
    expect(screen.getByText("Room for an answer.")).toBeInTheDocument();
  });
  it("keeps only five calculations and can clear history", async () => {
    api.mockResolvedValue(1);
    render(<App />);
    const user = await fill("1", "0");
    for (let i = 0; i < 6; i++) {
      await user.click(screen.getByRole("button", { name: "Calculate" }));
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Calculate" })).toBeEnabled(),
      );
    }
    const history = screen.getByRole("region", { name: "Recent calculations" });
    expect(within(history).getAllByRole("listitem")).toHaveLength(5);
    await user.click(screen.getByRole("button", { name: "Clear history" }));
    expect(within(history).queryByRole("list")).not.toBeInTheDocument();
  });
  it("times out a stalled request and aborts it", async () => {
    vi.useFakeTimers();
    api.mockImplementation(
      (_input, signal) =>
        new Promise((_resolve, reject) => {
          signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );
    render(<App />);
    fireEvent.change(screen.getByLabelText("First value"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Second value"), {
      target: { value: "2" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Calculate" }).closest("form")!,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(screen.getByRole("alert")).toHaveTextContent("timed out");
  });
  it("aborts in-flight work on unmount", async () => {
    api.mockImplementation(() => new Promise(() => {}));
    const { unmount } = render(<App />);
    const user = await fill();
    await user.click(screen.getByRole("button", { name: "Calculate" }));
    const signal = api.mock.calls[0][1]!;
    unmount();
    expect(signal.aborted).toBe(true);
  });
});
