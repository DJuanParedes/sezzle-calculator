# Test coverage

Backend measured locally on Windows with Go 1.27.1:

| Package | Statement coverage |
| --- | ---: |
| internal/calculator | 100.0% |
| internal/httpapi | 100.0% |
| cmd/server | 0.0% |
| Total | 78.7% |

The entry-point wiring is exercised by the production Docker smoke test, rather than unit instrumentation. The pure arithmetic and HTTP handler packages both have full statement coverage. Coverage does not establish correctness for every possible input.

Frontend measured with Vitest 4.1.11 and its V8 provider in GitHub Actions:

| File | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| App.tsx | 100% | 100% | 100% | 100% |
| api.ts | 100% | 100% | 100% | 100% |
| calculator.ts | 100% | 100% | 100% | 100% |
| Total | 100% | 100% | 100% | 100% |

**41 frontend tests passed.** The measured scope excludes main.tsx (React mounting), test files, and CSS. Thresholds are 90% statements/functions/lines and 85% branches. Go's command entry point remains included in the 78.7% backend total rather than being hidden from the report.

Verified run: [GitHub Actions run 34383706128](https://github.com/DJuanParedes/sezzle-calculator/actions/runs/34383706128), commit `e38ae89d544eedb83343bc89da2edd95829b1e51`.

All three jobs passed: frontend tests and production build; backend formatting, vet, race tests and coverage; Docker build and HTTP smoke tests. Downloadable HTML/LCOV/JSON reports are attached to that run while GitHub retains the artifacts. A persistent summary is included in this document.

Additional manual integration checks used the actual Go server and the production React build: all seven API operations, addition and percentage through the UI, division-by-zero feedback, and responsive inspection at 390 × 844. No horizontal overflow was observed. Unit tests also cover network failure and timeouts. These checks are not a claim of formal accessibility certification or exhaustive browser compatibility.

Local environment: Windows, Node 24.19.0 and Go 1.27.1. The frontend was built/tested on Linux CI because the local Windows sandbox blocks esbuild subprocess creation. The Docker job runs the production image as a non-root user and verifies the health endpoint, homepage, and addition response.
