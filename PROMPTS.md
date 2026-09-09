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

## Original assignment text

The candidate pasted the following assignment requirements in the same prompt (greeting and recruiting-process introduction omitted):

> As a next step, please complete the following within the next 5 business days.
>
> Objective
> Build a full-stack calculator application with a React frontend and a backend microservice. The frontend should consume the backend API to perform basic and advanced arithmetic operations. Focus on clean design, maintainable code, and testable architecture.
>
> Requirements
> Functional
> Operations:
> Addition, Subtraction, Multiplication, Division
> Optional: Exponentiation, Square Root, Percentage
> Frontend (React):
> Intuitive UI for entering input and displaying results
> Input validation and error handling
> Responsive design (basic mobile support)
> Backend (REST API):
> Expose endpoints for calculator operations
> Validate input and handle edge cases (division by zero, invalid data)
> Return results in JSON format
> Non-Functional
> Clean, readable, and idiomatic code (frontend and backend)
> Unit tests covering key functionality for both layers
> Documentation: setup instructions, API usage, and design rationale
> Optional: Dockerfile for full-stack deployment
> Constraints
> Frontend: React (TypeScript preferred)
> Backend: Go is perferred
> Deliverables
> Git repository with frontend and backend code
> README with setup instructions, API examples, and design decisions
> Unit tests and coverage report
> Optional: Dockerfile to run frontend + backend together
> Instructions
> Use any AI tooling you would like
> Spend ~2–4 hours on this assignment. Prioritize correctness, clarity, and maintainability over extra features.
> Push your solution to GitHub, GitLab, or another Git repository.
> Share the repository link with us for evaluation.
> Share any prompts that you used in your work
> Make sure your README includes:
> Setup instructions
> How to run the frontend and backend
> Examples of API calls (if using REST)
> Design decisions or assumptions.

## Verification and responsibility

See README and docs/COVERAGE.md for executed checks. No claims are made that a test suite proves all possible behavior. The code uses floating-point arithmetic and is not intended for financial accounting. The candidate should read and understand the code, tests, and documented assumptions before submitting.
