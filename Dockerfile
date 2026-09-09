FROM node:24-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM golang:1.27-alpine AS backend
WORKDIR /app/backend
COPY backend/ ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /server ./cmd/server

FROM alpine:3.23
RUN addgroup -S app && adduser -S -G app app
WORKDIR /app
COPY --from=backend /server /app/server
COPY --from=frontend /app/frontend/dist /app/static
ENV ADDR=:8080 STATIC_DIR=/app/static
USER app
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1:8080/api/health || exit 1
ENTRYPOINT ["/app/server"]

