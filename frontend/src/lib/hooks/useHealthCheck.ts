import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/apiClient";

interface HealthData {
  status: string;
  service: string;
  timestamp: string;
  uptimeSeconds: number;
}

export function useHealthCheck() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => apiRequest<HealthData>("/health"),
    retry: false,
  });
}