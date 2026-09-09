# Test coverage

Scientific calculator verified at commit `5590c25776e54d20a3714e3c130e99a84a526f83` in [GitHub Actions run 34387104366](https://github.com/DJuanParedes/sezzle-calculator/actions/runs/34387104366).

All three jobs passed: frontend tests and production build; backend formatting, vet, race tests and coverage; Docker build and HTTP smoke checks for both calculation endpoints.

## Backend

Measured with Go 1.27.1 locally; the same tests also passed with race detection on Linux CI.

| Package | Statement coverage |
| --- | ---: |
| internal/calculator | 99.4% |
| internal/httpapi | 100.0% |
| cmd/server | 0.0% |
| Total | 90.8% |

The entry-point wiring is exercised by the Docker smoke test and remains included in the total. Tests cover arithmetic, precedence, right-associative powers, unary signs, trigonometry in both modes, logarithms, factorials, invalid domains, resource limits, malformed HTTP requests and concurrent requests. Coverage is not proof of correctness for every possible input.

## Frontend

Measured with Vitest 4.1.11 and V8 in Linux CI. **39 tests passed.**

| File | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| App.tsx | 100% | 92.45% | 100% | 100% |
| api.ts | 100% | 100% | 100% | 100% |
| calculator.ts | 100% | 100% | 100% | 100% |
| Total | 100% | 95.34% | 100% | 100% |

Scope excludes React mounting, test files and CSS. Thresholds remain 90% statements/functions/lines and 85% branches. Tests exercise angle-mode changes, server-driven expression evaluation, selected-text replacement, keypad cursor placement, answer recall, history, input validation, cancellation, timeout, network errors and response validation. Four defensive null-selection fallback branches are not exercised with text inputs.

Downloadable HTML, LCOV and JSON reports are attached to the verified CI run while GitHub retains the artifacts. This document preserves the measured summary. The Windows sandbox blocks esbuild child-process creation, so frontend execution and production compilation were performed in Linux CI. The actual Go server also successfully evaluated `sin(30)+2^3` in degree mode as `8.5` locally.

Manual browser checks with the production bundle and actual Go API confirmed `sin(30)+2^3 = 8.5` in DEG and `sin(pi/2) = 1` in RAD. At a 390-pixel viewport, document width was 375 pixels with no horizontal overflow.
