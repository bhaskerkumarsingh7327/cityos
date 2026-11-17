import { describe, expect, it } from "vitest";
import { calculatePriorityScore } from "@/services/priorityEngine.js";

describe("Explainable Priority Engine", () => {
  it("calculates high priority for critical severity on main road", () => {
    const result = calculatePriorityScore({
      aiSeverity: "CRITICAL",
      isMainRoadOrHighway: true,
      repeatReportsCount: 3,
      hoursUnresolved: 48,
    });

    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(["HIGH", "CRITICAL"]).toContain(result.priority);
    expect(result.factors.severityScore).toBe(100);
    expect(result.factors.safetyScore).toBe(80);
    expect(result.factors.explanation).toContain("100pts");
  });

  it("calculates low priority for low severity with no repeats or safety risks", () => {
    const result = calculatePriorityScore({
      aiSeverity: "LOW",
      repeatReportsCount: 1,
      hoursUnresolved: 2,
    });

    expect(result.score).toBeLessThan(40);
    expect(result.priority).toBe("LOW");
    expect(result.factors.severityScore).toBe(20);
  });

  it("escalates priority when unresolved aging exceeds 72 hours", () => {
    const fresh = calculatePriorityScore({
      defaultSeverity: "MEDIUM",
      hoursUnresolved: 1,
    });

    const aged = calculatePriorityScore({
      defaultSeverity: "MEDIUM",
      hoursUnresolved: 80,
    });

    expect(aged.score).toBeGreaterThan(fresh.score);
    expect(aged.factors.unresolvedAgingScore).toBe(90);
  });
});
