// Base URL for the FastAPI backend. In production set NEXT_PUBLIC_API_URL
// (e.g. your deployed API origin or "/api"); locally it falls back to the
// dev server on port 8000.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
