import { z } from "zod";
import { hasNextSchema } from "../../../schemas/base/index.js";
import { createStructuredOutputSchema } from "../../../schemas/helper.js";

const notificationItemSchema = z.object({
  moduleId: z
    .string()
    .describe(
      "Module identifier that generated the notification (e.g., 'grn.schedule', 'grn.message')",
    ),
  creator: z
    .object({
      id: z.string().describe("User ID of the notification creator"),
      code: z.string().describe("User code of the notification creator"),
      name: z.string().describe("Display name of the notification creator"),
    })
    .describe("User who created the notification"),
  createdAt: z
    .string()
    .describe("Datetime when the notification was created in RFC 3339 format"),
  operation: z
    .string()
    .describe(
      "Operation type that triggered the notification: 'add', 'modify', or 'remove'",
    ),
  url: z.string().describe("URL to the resource that triggered the notification"),
  title: z.string().describe("Title of the notification"),
  body: z.string().describe("Body text of the notification"),
  icon: z.string().describe("Icon identifier for the notification"),
  isRead: z.boolean().describe("Whether the notification has been read"),
});

export const outputSchema = createStructuredOutputSchema({
  items: z
    .array(notificationItemSchema)
    .describe("List of notification items"),
  hasNext: hasNextSchema().describe(
    "Boolean indicating if there are more results (true indicates more results exist)",
  ),
});
