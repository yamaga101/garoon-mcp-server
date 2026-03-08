import { z } from "zod";
import { hasNextSchema } from "../../../schemas/base/index.js";
import { createStructuredOutputSchema } from "../../../schemas/helper.js";

const workflowRequestSchema = z.object({
  id: z.string().describe("Unique identifier for the workflow request"),
  name: z.string().describe("Name of the workflow request form"),
  number: z.string().describe("Request number assigned to the workflow request"),
  status: z
    .object({
      name: z.string().describe("Display name of the current status"),
      type: z
        .string()
        .describe(
          "Status type: 'UNPROCESSING' | 'IN_PROGRESS' | 'REJECTED' | 'WITHDRAWN' | 'SENT_BACK' | 'CANCELLED' | 'APPROVED' | 'COMPLETED'",
        ),
    })
    .describe("Current status of the workflow request"),
  isUrgent: z
    .boolean()
    .describe("Whether the workflow request is marked as urgent"),
  createdAt: z
    .string()
    .describe("Datetime when the request was created in RFC 3339 format"),
  processingStepCode: z
    .string()
    .describe("Code of the current processing step in the workflow"),
  applicant: z
    .object({
      id: z.string().describe("User ID of the applicant"),
      code: z.string().describe("User code of the applicant"),
      name: z.string().describe("Display name of the applicant"),
    })
    .describe("User who submitted the workflow request"),
});

export const outputSchema = createStructuredOutputSchema({
  requests: z
    .array(workflowRequestSchema)
    .describe("List of workflow request objects"),
  hasNext: hasNextSchema().describe(
    "Boolean indicating if there are more results (true indicates more results exist)",
  ),
});
