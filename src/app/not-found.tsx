"use client";

import { useEffect } from "react";

export default function NotFound() {
  useEffect(() => {
    fetch("/errors/ingest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          service_name: "next-app",
          error_code: "404",
          message: "Missing route",
          metadata: { path: window.location.pathname },
          severity: "warning",
        },
      ]),
    }).catch(console.error);
  }, []);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>404 – Az oldal nem található</h1>
      <p>A keresett oldal nem létezik vagy áthelyezték.</p>
    </div>
  );
}
