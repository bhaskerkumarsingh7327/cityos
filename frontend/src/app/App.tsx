import { useHealthCheck } from "@/lib/hooks/useHealthCheck";

/**
 * Phase 1 root component.
 * Purpose: verify the frontend ↔ backend connection works end-to-end.
 * Will be replaced by the real router (routes/) from Phase 3 onward.
 */
export default function App() {
  const { data, isLoading, isError, error } = useHealthCheck();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full border border-border rounded-lg p-6 space-y-4">
        <h1 className="text-2xl font-semibold">CityOS</h1>
        <p className="text-muted-foreground text-sm">
          Intelligent Urban Problem Solving Platform — Phase 1 Foundation
        </p>

        <div className="rounded-md bg-muted p-4 text-sm">
          {isLoading && <p>Checking backend connection...</p>}

          {isError && (
            <p className="text-destructive">
              Backend not reachable: {error instanceof Error ? error.message : "Unknown error"}
              <br />
              <span className="text-muted-foreground">
                Make sure the backend is running (`npm run dev` in /backend).
              </span>
            </p>
          )}

          {data && (
            <div className="space-y-1">
              <p>
                ✅ Backend status: <strong>{data.status}</strong>
              </p>
              <p>Service: {data.service}</p>
              <p>Uptime: {Math.round(data.uptimeSeconds)}s</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}