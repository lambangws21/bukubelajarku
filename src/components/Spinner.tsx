"use client";

export default function Spinner() {
  return (
    <div
      className="h-10 w-10 rounded-full border-4 border-muted border-t-primary animate-spin"
      aria-label="Loading"
      role="status"
    />
  );
}

