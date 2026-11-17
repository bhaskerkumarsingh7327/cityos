import type { IncidentStatus, UserRole } from "@/models/index.js";
import { ApiError } from "@/utils/ApiError.js";

interface TransitionRule {
  allowedTo: IncidentStatus[];
  allowedRoles: UserRole[];
}

/**
 * Core incident lifecycle state machine and role-based transition matrix:
 * REPORTED -> AI_PROCESSING -> UNDER_REVIEW -> VERIFIED -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CITIZEN_VERIFICATION -> CLOSED
 */
const TRANSITION_MATRIX: Record<IncidentStatus, TransitionRule> = {
  REPORTED: {
    allowedTo: ["AI_PROCESSING", "UNDER_REVIEW", "REJECTED", "CANCELLED"],
    allowedRoles: ["CITIZEN", "OFFICER", "CITY_ADMIN", "SUPER_ADMIN"],
  },
  AI_PROCESSING: {
    allowedTo: ["UNDER_REVIEW", "REPORTED"],
    allowedRoles: ["OFFICER", "CITY_ADMIN", "SUPER_ADMIN"],
  },
  UNDER_REVIEW: {
    allowedTo: ["VERIFIED", "REJECTED", "CANCELLED"],
    allowedRoles: ["OFFICER", "DEPARTMENT_ADMIN", "CITY_ADMIN", "SUPER_ADMIN"],
  },
  VERIFIED: {
    allowedTo: ["ASSIGNED", "UNDER_REVIEW", "CANCELLED"],
    allowedRoles: ["OFFICER", "DEPARTMENT_ADMIN", "CITY_ADMIN", "SUPER_ADMIN"],
  },
  ASSIGNED: {
    allowedTo: ["IN_PROGRESS", "VERIFIED", "CANCELLED"],
    allowedRoles: ["FIELD_WORKER", "OFFICER", "DEPARTMENT_ADMIN", "CITY_ADMIN", "SUPER_ADMIN"],
  },
  IN_PROGRESS: {
    allowedTo: ["RESOLVED", "ASSIGNED"],
    allowedRoles: ["FIELD_WORKER", "OFFICER", "DEPARTMENT_ADMIN", "CITY_ADMIN", "SUPER_ADMIN"],
  },
  RESOLVED: {
    allowedTo: ["CITIZEN_VERIFICATION", "CLOSED", "REOPENED"],
    allowedRoles: ["OFFICER", "CITIZEN", "DEPARTMENT_ADMIN", "CITY_ADMIN", "SUPER_ADMIN"],
  },
  CITIZEN_VERIFICATION: {
    allowedTo: ["CLOSED", "REOPENED"],
    allowedRoles: ["CITIZEN", "OFFICER", "CITY_ADMIN", "SUPER_ADMIN"],
  },
  CLOSED: {
    allowedTo: ["REOPENED"],
    allowedRoles: ["CITIZEN", "CITY_ADMIN", "SUPER_ADMIN"],
  },
  REOPENED: {
    allowedTo: ["UNDER_REVIEW", "ASSIGNED"],
    allowedRoles: ["OFFICER", "DEPARTMENT_ADMIN", "CITY_ADMIN", "SUPER_ADMIN"],
  },
  REJECTED: {
    allowedTo: ["UNDER_REVIEW"],
    allowedRoles: ["CITY_ADMIN", "SUPER_ADMIN"],
  },
  CANCELLED: {
    allowedTo: [],
    allowedRoles: [],
  },
};

/**
 * Validates whether a state transition from `fromStatus` to `toStatus` is permitted for `userRole`.
 * Throws ApiError if invalid.
 */
export function validateStatusTransition(
  fromStatus: IncidentStatus,
  toStatus: IncidentStatus,
  userRole: UserRole,
): void {
  if (fromStatus === toStatus) {
    throw ApiError.badRequest(`Incident is already in status '${fromStatus}'`);
  }

  const rule = TRANSITION_MATRIX[fromStatus];
  if (!rule || !rule.allowedTo.includes(toStatus)) {
    throw ApiError.badRequest(
      `Invalid status transition: Cannot move incident from '${fromStatus}' to '${toStatus}'. Allowed transitions: [${
        rule?.allowedTo.join(", ") || "none"
      }]`,
    );
  }

  if (!rule.allowedRoles.includes(userRole)) {
    throw ApiError.forbidden(
      `Permission denied: Role '${userRole}' is not authorized to transition incident from '${fromStatus}' to '${toStatus}'`,
    );
  }
}
