import type { IncidentPriority } from "@/models/index.js";

export interface PriorityEvaluationInput {
  categorySlug?: string;
  defaultSeverity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  aiSeverity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  repeatReportsCount?: number;
  isMainRoadOrHighway?: boolean;
  hoursUnresolved?: number;
}

export interface PriorityEvaluationResult {
  priority: IncidentPriority;
  score: number; // 0 to 100
  factors: {
    severityScore: number;
    safetyScore: number;
    repeatFactor: number;
    unresolvedAgingScore: number;
    explanation: string;
  };
}

const SEVERITY_SCORES: Record<string, number> = {
  LOW: 20,
  MEDIUM: 50,
  HIGH: 80,
  CRITICAL: 100,
};

/**
 * Priority Scoring Formula:
 * Total Score = (SeverityScore * 0.40) + (SafetyScore * 0.25) + (RepeatFactor * 0.20) + (AgingScore * 0.15)
 *
 * Cut-offs:
 * - 80-100: CRITICAL
 * - 60-79:  HIGH
 * - 35-59:  MEDIUM
 * - 0-34:   LOW
 */
export function calculatePriorityScore(input: PriorityEvaluationInput): PriorityEvaluationResult {
  const chosenSeverity = input.aiSeverity || input.defaultSeverity || "MEDIUM";
  const severityScore = SEVERITY_SCORES[chosenSeverity] || 50;

  // Safety impact score based on road type and category
  let safetyScore = 50;
  if (input.isMainRoadOrHighway) {
    safetyScore += 30;
  }
  if (input.categorySlug === "water-leak" || input.categorySlug === "pothole") {
    safetyScore += 15;
  }
  safetyScore = Math.min(100, safetyScore);

  // Repeat factor: more duplicate reports within vicinity escalate priority
  const count = input.repeatReportsCount || 1;
  const repeatFactor = Math.min(100, 20 + count * 15);

  // Aging score: older unresolved issues climb up
  const hours = input.hoursUnresolved || 0;
  let unresolvedAgingScore = 10;
  if (hours > 72) unresolvedAgingScore = 90;
  else if (hours > 48) unresolvedAgingScore = 70;
  else if (hours > 24) unresolvedAgingScore = 40;

  // Weighted formula
  const compositeScore = Math.round(
    severityScore * 0.4 + safetyScore * 0.25 + repeatFactor * 0.2 + unresolvedAgingScore * 0.15,
  );

  let priority: IncidentPriority = "MEDIUM";
  if (compositeScore >= 80) priority = "CRITICAL";
  else if (compositeScore >= 60) priority = "HIGH";
  else if (compositeScore >= 35) priority = "MEDIUM";
  else priority = "LOW";

  const explanation = `Score ${compositeScore}/100 [Severity: ${chosenSeverity} (${severityScore}pts), Safety Risk: ${safetyScore}pts, Repeat Reports: ${count} (${repeatFactor}pts), Age: ${hours}h (${unresolvedAgingScore}pts)].`;

  return {
    priority,
    score: compositeScore,
    factors: {
      severityScore,
      safetyScore,
      repeatFactor,
      unresolvedAgingScore,
      explanation,
    },
  };
}
