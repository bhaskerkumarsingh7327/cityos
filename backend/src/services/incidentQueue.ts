import { Incident } from "@/models/Incident.js";
import { analyzeIncidentImage } from "@/services/aiService.js";
import { calculatePriorityScore } from "@/services/priorityEngine.js";
import { logger } from "@/utils/logger.js";

/**
 * Asynchronously processes an incident in the background:
 * 1. Executes AI Computer Vision classification on uploaded media
 * 2. Runs explainable priority scoring
 * 3. Updates the incident record in MongoDB
 * 4. Transitions status from AI_PROCESSING -> UNDER_REVIEW
 */
export async function enqueueIncidentAIJob(
  incidentId: string,
  mediaUrl?: string,
  categorySlug?: string,
): Promise<void> {
  // Non-blocking asynchronous execution
  setImmediate(async () => {
    try {
      const incident = await Incident.findById(incidentId).populate("category");
      if (!incident) return;

      let aiResult;
      if (mediaUrl) {
        aiResult = await analyzeIncidentImage(mediaUrl, categorySlug);
      } else {
        aiResult = {
          category: categorySlug || "general",
          confidence: 0.85,
          severity: "MEDIUM" as const,
          detectedObjects: ["manual_report"],
          processedAt: new Date(),
        };
      }

      // Compute explainable priority score
      const priorityResult = calculatePriorityScore({
        categorySlug,
        aiSeverity: aiResult.severity,
      });

      incident.aiAnalysis = aiResult;
      incident.priority = priorityResult.priority;
      incident.priorityScore = priorityResult.score;
      incident.priorityFactors = priorityResult.factors;

      // If incident was in AI_PROCESSING, transition to UNDER_REVIEW
      if (incident.status === "AI_PROCESSING") {
        incident.status = "UNDER_REVIEW";
        incident.statusHistory.push({
          fromStatus: "AI_PROCESSING",
          toStatus: "UNDER_REVIEW",
          changedBy: incident.reporter,
          reason: "Automated AI classification and priority scoring completed",
          timestamp: new Date(),
        });
      }

      await incident.save();

      logger.info("Background AI job completed for incident", {
        incidentNumber: incident.incidentNumber,
        category: aiResult.category,
        priority: priorityResult.priority,
        score: priorityResult.score,
      });
    } catch (error) {
      logger.error("Error in background incident AI worker", {
        incidentId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}
