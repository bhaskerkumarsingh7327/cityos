import { describe, expect, it } from "vitest";
import { validateStatusTransition } from "@/services/incidentStateMachine.js";
import { ApiError } from "@/utils/ApiError.js";

describe("Incident State Machine", () => {
  it("allows valid primary lifecycle transitions with authorized roles", () => {
    // REPORTED -> UNDER_REVIEW by OFFICER
    expect(() => validateStatusTransition("REPORTED", "UNDER_REVIEW", "OFFICER")).not.toThrow();

    // UNDER_REVIEW -> VERIFIED by OFFICER
    expect(() => validateStatusTransition("UNDER_REVIEW", "VERIFIED", "OFFICER")).not.toThrow();

    // VERIFIED -> ASSIGNED by OFFICER
    expect(() => validateStatusTransition("VERIFIED", "ASSIGNED", "OFFICER")).not.toThrow();

    // ASSIGNED -> IN_PROGRESS by FIELD_WORKER
    expect(() => validateStatusTransition("ASSIGNED", "IN_PROGRESS", "FIELD_WORKER")).not.toThrow();

    // IN_PROGRESS -> RESOLVED by FIELD_WORKER
    expect(() => validateStatusTransition("IN_PROGRESS", "RESOLVED", "FIELD_WORKER")).not.toThrow();

    // RESOLVED -> CITIZEN_VERIFICATION by CITIZEN
    expect(() =>
      validateStatusTransition("RESOLVED", "CITIZEN_VERIFICATION", "CITIZEN"),
    ).not.toThrow();

    // CITIZEN_VERIFICATION -> CLOSED by CITIZEN
    expect(() =>
      validateStatusTransition("CITIZEN_VERIFICATION", "CLOSED", "CITIZEN"),
    ).not.toThrow();
  });

  it("allows citizen rejection to REOPEN incident", () => {
    expect(() =>
      validateStatusTransition("CITIZEN_VERIFICATION", "REOPENED", "CITIZEN"),
    ).not.toThrow();

    expect(() => validateStatusTransition("REOPENED", "UNDER_REVIEW", "OFFICER")).not.toThrow();
  });

  it("rejects illegal transitions that violate the lifecycle state machine", () => {
    // Cannot skip steps directly from REPORTED to CLOSED
    expect(() => validateStatusTransition("REPORTED", "CLOSED", "SUPER_ADMIN")).toThrow(ApiError);

    // Cannot transition to self
    expect(() => validateStatusTransition("IN_PROGRESS", "IN_PROGRESS", "FIELD_WORKER")).toThrow(
      ApiError,
    );
  });

  it("rejects unauthorized roles trying to execute protected transitions", () => {
    // Citizen cannot directly mark an incident VERIFIED
    expect(() => validateStatusTransition("UNDER_REVIEW", "VERIFIED", "CITIZEN")).toThrow(ApiError);

    // Citizen cannot transition an incident to IN_PROGRESS
    expect(() => validateStatusTransition("ASSIGNED", "IN_PROGRESS", "CITIZEN")).toThrow(ApiError);
  });
});
