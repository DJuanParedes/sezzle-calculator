# AI assistance and prompts

## Candidate request

The candidate supplied the Sezzle assignment and asked (in Spanish):
“porfavor ten en cuenta todo lo que te dice y hazlo bien, me mandas el link.”

## Assignment supplied to the assistant

Build a full-stack calculator with a React frontend and REST backend microservice (TypeScript and Go preferred). Support addition, subtraction, multiplication and division; optional exponentiation, square root and percentage. Include intuitive responsive UI, input validation, errors such as division by zero, JSON results, clean maintainable architecture, frontend/backend unit tests, coverage report, setup/API/design documentation, optional Docker deployment, and a Git repository link. Share all AI prompts. Prioritize correctness, clarity and maintainability within the suggested 2–4 hour scope.

## How AI was used

OpenAI Codex implemented the application, authored tests and documentation, ran checks, and inspected the interface. No subagents or image-generation tools were used for this project. Tool calls to write source code, run tests, inspect local UI, and publish the repository were operational actions, not separate human-authored prompts.

The assistant's implementation direction was:
- Build React/TypeScript with a small standard-library Go API.
- Keep arithmetic separate from transport and validate independently on both sides.
- Define seven explicit operations and percentage semantics.
- Include strict request handling, response validation, loading/error recovery and session-only history.
- Test edge cases and API/component boundaries, measure coverage and disclose limitations.
- Use an understated responsive calculator interface and document reproducible setup.
- Publish only the calculator project, excluding unrelated workspace documents and personal data.

## Verification and responsibility

See README and docs/COVERAGE.md for executed checks. No claims are made that a test suite proves all possible behavior. The code uses floating-point arithmetic and is not intended for financial accounting. The candidate should read and understand the code, tests, and documented assumptions before submitting.

