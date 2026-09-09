# Calc — full-stack calculator

[![Tests and build](https://github.com/DJuanParedes/sezzle-calculator/actions/workflows/ci.yml/badge.svg)](https://github.com/DJuanParedes/sezzle-calculator/actions/workflows/ci.yml)

A focused calculator built for the Sezzle take-home assignment. React + TypeScript provide the interface; a Go REST microservice performs **every calculation**. Includes seven operations, responsive layout, accessible labels, keyboard submission, error recovery, and the last five successful calculations in session memory.

## Quick start

Prerequisites: **Node.js 24 LTS**, npm, and **Go 1.26 or newer** (validated with Go 1.27). No database, API keys, or third-party Go modules are required.

Terminal 1, from the repository root:

```sh
cd backend
go run ./cmd/server
```

Terminal 2:

```sh
cd frontend
npm ci
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/api` to `http://127.0.0.1:8080`. If port 5173 is occupied, use the URL printed by Vite. The API defaults to port 8080; `ADDR` can override its bind address (update the Vite proxy if changing the port).

### Production / Docker

```sh
docker build -t sezzle-calculator .
docker run --rm -p 8080:8080 sezzle-calculator
```

Open **http://localhost:8080**. The multistage image compiles both layers and runs a single, unprivileged Go process, serving the React build and the API on the same origin. The API remains a separate package and can be deployed independently. No CORS wildcard or client-side calculation fallback is used.

Without Docker, build the frontend with `npm run build`, build the Go server with `go build -o server ./cmd/server`, and set `STATIC_DIR` to the absolute path of `frontend/dist` when starting the server. On PowerShell, environment variables use `$env:STATIC_DIR = 'C:\path\to\frontend\dist'`; on macOS/Linux use `STATIC_DIR=/path/to/frontend/dist ./server`.

## API

### POST /api/calculate

Send `Content-Type: application/json`. Operands are JSON numbers, not strings or null.

```sh
curl -i http://localhost:8080/api/calculate \
  -H 'Content-Type: application/json' \
  -d '{"operation":"add","operands":[24,8]}'
```

```json
{"result":32}
```

PowerShell equivalent:

```powershell
Invoke-RestMethod -Uri http://localhost:8080/api/calculate -Method Post -ContentType 'application/json' -Body '{"operation":"add","operands":[24,8]}'
```

| Operation | Operands | Definition / example |
| --- | --- | --- |
| `add` | `[a,b]` | `a + b` |
| `subtract` | `[a,b]` | `a - b` |
| `multiply` | `[a,b]` | `a × b` |
| `divide` | `[a,b]` | `a / b`; zero divisor rejected |
| `power` | `[a,b]` | `a^b`; non-real results and `0^0` rejected |
| `sqrt` | `[a]` | Non-negative real square root |
| `percentage` | `[a,b]` | `a / 100 × b`; `[15,200]` returns `30` |

Examples:

```sh
curl -H 'Content-Type: application/json' -d '{"operation":"sqrt","operands":[81]}' http://localhost:8080/api/calculate
curl -H 'Content-Type: application/json' -d '{"operation":"percentage","operands":[15,200]}' http://localhost:8080/api/calculate
curl -i -H 'Content-Type: application/json' -d '{"operation":"divide","operands":[1,0]}' http://localhost:8080/api/calculate
```

Division by zero returns HTTP **400**:

```json
{"error":{"code":"division_by_zero","message":"Cannot divide by zero."}}
```

Other error codes: `invalid_operation`, `invalid_operands`, `invalid_domain`, `invalid_json` (400); `not_found` (404); `method_not_allowed` (405 with Allow header); `body_too_large` (413); `unsupported_media_type` (415). The server rejects extra fields, trailing JSON, null operands, non-finite values, incorrect arity, and bodies over 4096 bytes. Duplicate JSON keys follow Go encoding/json semantics (the last value wins); this is a documented parser behavior, not an expression evaluator.

### GET /api/health

```sh
curl http://localhost:8080/api/health
```

Returns HTTP 200 and `{"status":"ok"}`.

## Tests and coverage

Backend:

```sh
cd backend
go vet ./...
go test "-coverprofile=coverage.out" ./...
go tool cover "-func=coverage.out"
go tool cover "-html=coverage.out" -o coverage.html
```

Run `go test -race ./...` on a supported environment; GitHub Actions runs this on Linux. Windows race detection requires an appropriate C toolchain.

Frontend:

```sh
cd frontend
npm ci
npm run test:coverage
npm run build
```

The HTML report is `frontend/coverage/index.html`. Machine-readable LCOV and JSON summaries are also generated. Backend coverage output and HTML reports are available as CI artifacts. See [coverage report](docs/COVERAGE.md) for measured results and scope.

Tests cover all operations, arithmetic edge cases, API contracts, malformed requests, null and non-finite operands, resource limits, concurrent requests, frontend validation, fetch response validation, loading/duplicate submission, server and network errors, timeouts, history, and unary/percentage behavior. React component tests mock only the API boundary; the API client tests exercise fetch serialization separately.

GitHub Actions tests both layers, enforces frontend coverage thresholds, builds the production bundle, and builds/smoke-tests the Docker image.

## Architecture and decisions

```text
frontend/src/
  App.tsx             Form, pending/error/result states, session history
  calculator.ts       Operation metadata, input parsing, expression labels
  api.ts              Typed HTTP client and response validation
backend/
  cmd/server/         Configuration, timeouts, graceful shutdown, static serving
  internal/httpapi/   JSON decoding, transport validation and stable error envelope
  internal/calculator/ Pure arithmetic and domain validation
```

- **Small standard-library backend:** no framework needed for two endpoints. Arithmetic is independent of HTTP and is easy to test.
- **Backend as source of truth:** the frontend validates for immediate feedback; the backend independently validates all requests. No arithmetic is evaluated in React.
- **Numeric scope:** IEEE 754 `float64` in Go and `number` in JavaScript. Decimal results such as `0.1 + 0.2 = 0.30000000000000004` are intentionally not silently rounded. The display shows the serialized result. This is a general arithmetic calculator, **not financial/decimal accounting software**. Underflow may become zero; overflow/non-real results are rejected. Large integers beyond the safe integer range may lose precision.
- **Percentage:** explicitly “a percent of b,” rather than context-dependent calculator-key semantics.
- **Explicit operations, no eval:** inputs accept finite decimal/scientific notation (a dot decimal separator); expressions, hex, commas, and arbitrary code are rejected.
- **One origin:** Vite proxy in development; Go static serving in production. This avoids unnecessary cross-origin configuration.
- **Predictable state:** edits clear the displayed result; successful results add up to five in-memory history entries. History clears on refresh and is not sent to any storage service.
- **Bounded work:** 4 KiB request limit, HTTP timeouts, and a 10-second client timeout. Form controls are disabled while calculating; duplicate submissions and in-flight work on unmount are handled.
- **Accessibility:** native form controls, visible focus styles, semantic labels, operation pressed states, live result announcement, error alerts, and reduced-motion support. Layout supports narrow screens.
- **Deliberate omissions:** no authentication, persistence, arbitrary expression parser, or observability stack. These would exceed this assignment's useful scope.
- **Fonts:** Google Fonts is optional visual enhancement; system sans-serif fallbacks keep the app usable without that network request.

## AI assistance

AI tooling was explicitly permitted by the assignment. The requirements, prompts, implementation workflow, and review scope are disclosed in [PROMPTS.md](PROMPTS.md). Tests and coverage are actual executed results, not estimated percentages. The candidate should review the implementation and be prepared to explain these decisions.
