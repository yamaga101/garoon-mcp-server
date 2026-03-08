import { z } from "zod";
import { limitSchema, offsetSchema } from "../../../schemas/base/index.js";

export const inputSchema = {
  limit: limitSchema().describe(
    "Maximum number of workflow requests to return (1-1000, default: 100)",
  ),
  offset: offsetSchema().describe(
    "Number of workflow requests to skip from the beginning (default: 0)",
  ),
  status: z
    .string()
    .optional()
    .describe(
      "Filter by request status: 'UNPROCESSING' | 'IN_PROGRESS' | 'REJECTED' | 'WITHDRAWN' | 'SENT_BACK' | 'CANCELLED' | 'APPROVED' | 'COMPLETED'",
    ),
  orderBy: z
    .object({
      property: z
        .string()
        .describe("Property name to sort by (e.g., 'createdAt', 'updatedAt')"),
      order: z
        .string()
        .describe("Sort order: 'asc' for ascending or 'desc' for descending"),
    })
    .optional()
    .describe("Sort order configuration for the results"),
};
