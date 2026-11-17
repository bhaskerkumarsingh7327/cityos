import { apiRequest } from "@/lib/apiClient";
import type { Incident, IncidentStatus } from "@/types";

export interface CreateIncidentPayload {
  title: string;
  description: string;
  category: string;
  coordinates: [number, number]; // [lng, lat]
  address?: string;
  mediaUrl?: string;
}

export interface AnalyticsOverview {
  totalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  criticalIncidents: number;
  avgResolutionHours: number;
  statusBreakdown: Record<string, number>;
}

export interface CategoryStat {
  _id: string;
  slug: string;
  count: number;
  avgPriorityScore: number;
}

export const api = {
  getIncidents: async (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/incidents?${query}` : "/incidents";
    return apiRequest<{ incidents: Incident[]; pagination: { total: number } }>(endpoint);
  },

  getIncidentById: async (id: string) => {
    return apiRequest<Incident>(`/incidents/${id}`);
  },

  createIncident: async (payload: CreateIncidentPayload) => {
    return apiRequest<Incident>("/incidents", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateStatus: async (id: string, status: IncidentStatus, reason?: string) => {
    return apiRequest<Incident>(`/incidents/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    });
  },

  assignIncident: async (id: string, workerId?: string, departmentId?: string) => {
    return apiRequest<Incident>(`/incidents/${id}/assign`, {
      method: "POST",
      body: JSON.stringify({ workerId, departmentId }),
    });
  },

  verifyResolution: async (id: string, satisfied: boolean, comments?: string) => {
    return apiRequest<Incident>(`/incidents/${id}/verify-resolution`, {
      method: "POST",
      body: JSON.stringify({ satisfied, comments }),
    });
  },

  startWork: async (id: string, beforeMediaUrl: string, notes?: string) => {
    return apiRequest<Incident>(`/workers/tasks/${id}/start`, {
      method: "POST",
      body: JSON.stringify({ beforeMediaUrl, notes }),
    });
  },

  completeWork: async (id: string, afterMediaUrl: string, resolutionNotes: string) => {
    return apiRequest<Incident>(`/workers/tasks/${id}/complete`, {
      method: "POST",
      body: JSON.stringify({ afterMediaUrl, resolutionNotes }),
    });
  },

  getAnalyticsOverview: async () => {
    return apiRequest<AnalyticsOverview>("/analytics/overview");
  },

  getAnalyticsCategories: async () => {
    return apiRequest<{ categories: CategoryStat[] }>("/analytics/categories");
  },

  getMapGeoJSON: async () => {
    return apiRequest<{
      type: "FeatureCollection";
      features: Array<{
        type: "Feature";
        geometry: { type: "Point"; coordinates: [number, number] };
        properties: Record<string, unknown>;
      }>;
    }>("/maps/geojson");
  },

  getHotspots: async () => {
    return apiRequest<{
      hotspots: Array<{
        _id: { lng: number; lat: number };
        count: number;
      }>;
    }>("/maps/hotspots");
  },
};
