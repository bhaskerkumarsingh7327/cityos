import { describe, expect, it } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "@/app/App";
import { useAuthStore } from "@/store/useAuthStore";

describe("Frontend Core Application", () => {
  it("renders the CityOS platform navigation and tab hubs", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    );

    expect(screen.getByText("CityOS")).toBeInTheDocument();
    expect(screen.getByText("Portal:")).toBeInTheDocument();
  });

  it("switches to Field Worker portal and enforces photographic evidence requirements", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    act(() => {
      useAuthStore.getState().switchDemoRole("FIELD_WORKER");
    });

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    );

    expect(screen.getByText(/Field Technician Work Orders/i)).toBeInTheDocument();
    expect(screen.getByText(/Arrival Proof \(Mandatory Before-Photo\)/i)).toBeInTheDocument();
  });
});
