import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { calculate } from "./api";

type Entry = { id: number; expression: string; result: number; mode: string };
const keys = [
  ["sin", "sin("],
  ["cos", "cos("],
  ["tan", "tan("],
  ["(", "("],
  [")", ")"],
  ["asin", "asin("],
  ["acos", "acos("],
  ["atan", "atan("],
  ["π", "pi"],
  ["e", "e"],
  ["ln", "ln("],
  ["log", "log("],
  ["√", "sqrt("],
  ["xʸ", "^"],
  ["x!", "!"],
  ["7", "7"],
  ["8", "8"],
  ["9", "9"],
  ["÷", "/"],
  ["abs", "abs("],
  ["4", "4"],
  ["5", "5"],
  ["6", "6"],
  ["×", "*"],
  ["exp", "exp("],
  ["1", "1"],
  ["2", "2"],
  ["3", "3"],
  ["−", "-"],
  ["%", "%"],
  ["0", "0"],
  [".", "."],
  ["Ans", "Ans"],
  ["+", "+"],
  ["=", "="],
];
export default function App() {
  const [expression, setExpression] = useState("");
  const [mode, setMode] = useState<"deg" | "rad">("deg");
  const [history, setHistory] = useState<Entry[]>([]);
  const [result, setResult] = useState<Entry | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const request = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  const answer = useRef(0);
  const caret = useRef<number | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  useLayoutEffect(() => {
    if (caret.current !== null) {
      input.current!.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  });
  function edit(value: string, position: number | null = null) {
    caret.current = position;
    setExpression(value);
    setResult(null);
    setError("");
  }
  function insert(token: string) {
    const field = input.current!;
    const start = field.selectionStart ?? expression.length;
    const end = field.selectionEnd ?? start;
    const value = token === "Ans" ? `(${answer.current})` : token;
    edit(
      expression.slice(0, start) + value + expression.slice(end),
      start + value.length,
    );
    field.focus();
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (request.current) return;
    setError("");
    setResult(null);
    if (!expression.trim() || expression.length > 512) {
      setError("Enter an expression of 1–512 characters.");
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    const timer = window.setTimeout(() => controller.abort(), 10000);
    try {
      const value = await calculate(
        { expression, angleMode: mode },
        controller.signal,
      );
      answer.current = value;
      const entry = { id: ++sequence.current, expression, result: value, mode };
      setResult(entry);
      setHistory((previous) => [entry, ...previous].slice(0, 5));
    } catch (err) {
      setError(
        controller.signal.aborted
          ? "The request timed out. Please try again."
          : err instanceof TypeError
            ? "Cannot reach the server. Check your connection and try again."
            : (err as Error).message,
      );
    } finally {
      window.clearTimeout(timer);
      request.current = null;
      setLoading(false);
    }
  }
  return (
    <div className="app scientific-app">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Calc home">
          <span className="brand-icon">=</span>calc
          <span className="brand-dot">.</span>
        </a>
        <span className="top-note">SCIENTIFIC CALCULATOR</span>
      </header>
      <main>
        <section className="intro">
          <p className="eyebrow">
            <span /> EXPLORE THE POSSIBILITIES
          </p>
          <h1>
            Beyond
            <br />
            <em>the basics.</em>
          </h1>
          <p className="intro-text">
            From everyday sums to
            <br />
            your next big equation.
          </p>
          <div className="intro-rule" />
          <p className="intro-detail">
            Trigonometry. Logarithms. Powers.
            <br />A little space for bigger thinking.
          </p>
          <div className="math-art" aria-hidden="true">
            <span>π</span>
            <span>√</span>
            <span>ƒ</span>
            <span>∞</span>
          </div>
        </section>
        <section className="workspace" aria-label="Calculator">
          <div className="calculator scientific-card">
            <form onSubmit={submit} noValidate>
              <fieldset disabled={loading}>
                <legend className="sr-only">Scientific calculator</legend>
                <div className="card-heading">
                  <h2>Scientific</h2>
                  <div className="angle-toggle" aria-label="Angle mode">
                    {(["deg", "rad"] as const).map((value) => (
                      <button
                        type="button"
                        key={value}
                        aria-pressed={mode === value}
                        onClick={() => {
                          setMode(value);
                          setResult(null);
                          setError("");
                        }}
                      >
                        {value.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="scientific-display">
                  <label htmlFor="expression">EXPRESSION</label>
                  <input
                    ref={input}
                    id="expression"
                    autoComplete="off"
                    spellCheck={false}
                    value={expression}
                    placeholder="sin(30) + 2^3"
                    aria-invalid={!!error}
                    aria-describedby={
                      error ? "calculation-error" : "expression-help"
                    }
                    onChange={(event) => edit(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") edit("");
                    }}
                  />
                  <div
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    className="scientific-result"
                  >
                    {loading
                      ? "Calculating…"
                      : result
                        ? String(result.result)
                        : "0"}
                  </div>
                </div>
                <div className="scientific-tools">
                  <span>{mode === "deg" ? "Degrees" : "Radians"}</span>
                  <button
                    type="button"
                    onClick={() => {
                      edit("");
                      input.current?.focus();
                    }}
                  >
                    AC
                  </button>
                  <button
                    type="button"
                    aria-label="Backspace"
                    onClick={() => {
                      const field = input.current!;
                      const start = field.selectionStart ?? expression.length;
                      const end = field.selectionEnd ?? start;
                      edit(
                        expression.slice(
                          0,
                          start === end ? Math.max(0, start - 1) : start,
                        ) + expression.slice(end),
                        start === end ? Math.max(0, start - 1) : start,
                      );
                      field.focus();
                    }}
                  >
                    ⌫
                  </button>
                </div>
                <div className="scientific-keys">
                  {keys.map(([label, value]) => (
                    <button
                      key={label}
                      type={value === "=" ? "submit" : "button"}
                      className={
                        value === "="
                          ? "equals-key"
                          : /^[0-9.]$/.test(value)
                            ? "number-key"
                            : "function-key"
                      }
                      aria-label={value === "=" ? "Calculate" : label}
                      onClick={value === "=" ? undefined : () => insert(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
              {error && (
                <p className="error" id="calculation-error" role="alert">
                  {error}
                </p>
              )}
              <p className="number-help" id="expression-help">
                Enter to calculate · Esc to clear · Use * to multiply
                <br />% divides by 100 · Ans recalls your last answer
              </p>
            </form>
          </div>
          <section className="history" aria-label="Recent calculations">
            <div className="history-heading">
              <h2>Recent calculations</h2>
              {history.length > 0 ? (
                <button type="button" onClick={() => setHistory([])}>
                  Clear history
                </button>
              ) : (
                <span>THIS SESSION</span>
              )}
            </div>
            {history.length === 0 ? (
              <p className="history-empty">
                Your last five calculations will appear here.
              </p>
            ) : (
              <ol>
                {history.map((entry) => (
                  <li key={entry.id}>
                    <span>
                      {entry.expression}{" "}
                      <small>({entry.mode.toUpperCase()})</small>
                    </span>
                    <strong>= {String(entry.result)}</strong>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </section>
      </main>
      <footer>
        <span>Made for a moment of clarity.</span>
      </footer>
    </div>
  );
}
