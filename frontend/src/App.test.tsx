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
const field = () => screen.getByRole("textbox", { name: "EXPRESSION" });
const run = () =>
  fireEvent.submit(
    screen.getByRole("button", { name: "Calculate" }).closest("form")!,
  );
describe("scientific calculator", () => {
  it("validates empty and oversized input", () => {
    render(<App />);
    run();
    expect(screen.getByRole("alert")).toHaveTextContent("1–512");
    fireEvent.change(field(), { target: { value: "1".repeat(513) } });
    run();
    expect(api).not.toHaveBeenCalled();
  });
  it("submits expressions via Enter and changes angle mode", async () => {
    api.mockResolvedValue(0.5);
    render(<App />);
    await userEvent.type(field(), "sin(30){Enter}");
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("0.5"),
    );
    expect(api).toHaveBeenCalledWith(
      { expression: "sin(30)", angleMode: "deg" },
      expect.any(AbortSignal),
    );
    fireEvent.click(screen.getByRole("button", { name: "RAD" }));
    expect(screen.getByText("Radians")).toBeInTheDocument();
    run();
    await waitFor(() =>
      expect(api).toHaveBeenLastCalledWith(
        { expression: "sin(30)", angleMode: "rad" },
        expect.any(AbortSignal),
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "DEG" }));
  });
  it("inserts keypad functions and replaces selected text", async () => {
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "sin" }));
    expect(field()).toHaveValue("sin(");
    fireEvent.change(field(), { target: { value: "12" } });
    (field() as HTMLInputElement).setSelectionRange(0, 2);
    await userEvent.click(screen.getByRole("button", { name: "π" }));
    expect(field()).toHaveValue("pi");
    await waitFor(() =>
      expect((field() as HTMLInputElement).selectionStart).toBe(2),
    );
  });
  it("clears and deletes characters or selection", () => {
    render(<App />);
    fireEvent.change(field(), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: "Backspace" }));
    expect(field()).toHaveValue("12");
    (field() as HTMLInputElement).setSelectionRange(0, 2);
    fireEvent.click(screen.getByRole("button", { name: "Backspace" }));
    expect(field()).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "Backspace" }));
    fireEvent.change(field(), { target: { value: "42" } });
    fireEvent.click(screen.getByRole("button", { name: "AC" }));
    expect(field()).toHaveValue("");
    expect(field()).toHaveFocus();
    fireEvent.change(field(), { target: { value: "2" } });
    fireEvent.keyDown(field(), { key: "Escape" });
    expect(field()).toHaveValue("");
  });
  it("recalls the last answer and limits history to five", async () => {
    api.mockResolvedValue(42);
    render(<App />);
    for (let i = 0; i < 6; i++) {
      fireEvent.change(field(), { target: { value: String(i) } });
      run();
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Calculate" })).toBeEnabled(),
      );
    }
    expect(
      within(screen.getByRole("list")).getAllByRole("listitem"),
    ).toHaveLength(5);
    fireEvent.click(screen.getByRole("button", { name: "AC" }));
    fireEvent.click(screen.getByRole("button", { name: "Ans" }));
    expect(field()).toHaveValue("(42)");
    fireEvent.click(screen.getByRole("button", { name: "Clear history" }));
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
  it.each([
    new Error("Cannot divide by zero."),
    new TypeError("Failed to fetch"),
  ])("shows errors and allows retry: %s", async (error) => {
    api.mockRejectedValueOnce(error).mockResolvedValue(2);
    render(<App />);
    fireEvent.change(field(), { target: { value: "1/0" } });
    run();
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        error instanceof TypeError ? "Cannot reach" : "Cannot divide",
      ),
    );
    fireEvent.change(field(), { target: { value: "1+1" } });
    run();
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("2"),
    );
  });
  it("prevents duplicate requests and aborts on unmount", () => {
    api.mockImplementation(() => new Promise(() => {}));
    const view = render(<App />);
    fireEvent.change(field(), { target: { value: "1+2" } });
    run();
    run();
    expect(api).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("Calculating");
    expect(screen.getByRole("button", { name: "Calculate" })).toBeDisabled();
    const signal = api.mock.calls[0][1]!;
    view.unmount();
    expect(signal.aborted).toBe(true);
  });
  it("times out requests", async () => {
    vi.useFakeTimers();
    api.mockImplementation(
      (_, signal) =>
        new Promise((_, reject) =>
          signal!.addEventListener("abort", () => reject(new Error("aborted"))),
        ),
    );
    render(<App />);
    fireEvent.change(field(), { target: { value: "1" } });
    run();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(screen.getByRole("alert")).toHaveTextContent("timed out");
  });
});
