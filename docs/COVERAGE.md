# Test coverage

Backend measured locally on Windows with Go 1.27.1:

| Package | Statement coverage |
| --- | ---: |
| internal/calculator | 100.0% |
| internal/httpapi | 100.0% |
| cmd/server | 0.0% |
| Total | 78.7% |

The entry-point wiring is exercised by the production Docker smoke test, rather than unit instrumentation. The pure arithmetic and HTTP handler packages both have full statement coverage. Coverage does not establish correctness for every possible input.

Frontend results and CI verification will be recorded after the initial run. Windows sandbox restrictions prevent the local esbuild subprocess; GitHub Actions runs the unmodified installation, tests, and build on Linux.
