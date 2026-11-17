/**
 * CityOS Domain Models & Types
 */

export type UserRole =
  "CITIZEN" | "FIELD_WORKER" | "OFFICER" | "DEPARTMENT_ADMIN" | "CITY_ADMIN" | "SUPER_ADMIN";

export type IncidentStatus =
  | "REPORTED"
  | "AI_PROCESSING"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CITIZEN_VERIFICATION"
  | "CLOSED"
  | "REJECTED"
  | "REOPENED"
  | "CANCELLED";

export type IncidentPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  department?: string;
}

export interface IncidentCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  defaultSeverity: IncidentPriority;
  slaHours: number;
  icon?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface IncidentMedia {
  mediaId: string;
  url: string;
  mimeType: string;
  phase: "initial" | "before" | "after";
  uploadedAt: string;
}

export interface StatusHistoryItem {
  fromStatus: IncidentStatus;
  toStatus: IncidentStatus;
  changedBy: { id: string; name: string; role: string } | string;
  reason?: string;
  timestamp: string;
}

export interface Incident {
  id: string;
  incidentNumber: string;
  title: string;
  description: string;
  reporter?: User;
  category: IncidentCategory;
  department?: Department;
  assignedWorker?: User;
  status: IncidentStatus;
  priority: IncidentPriority;
  priorityScore: number;
  priorityFactors?: {
    severityScore: number;
    safetyScore: number;
    repeatFactor: number;
    unresolvedAgingScore: number;
    explanation: string;
  };
  aiAnalysis?: {
    category?: string;
    confidence: number;
    severity?: IncidentPriority;
    detectedObjects?: string[];
    processedAt: string;
  };
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  address?: string;
  media: IncidentMedia[];
  statusHistory: StatusHistoryItem[];
  resolution?: {
    resolvedAt?: string;
    resolutionNotes?: string;
    citizenFeedback?: {
      satisfied: boolean;
      comments?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface HealthCheckData {
  status: string;
  service: string;
  version: string;
  database: string;
  timestamp: string;
  uptimeSeconds: number;
}
