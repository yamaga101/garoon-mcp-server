import { z } from "zod";
import { createStructuredOutputSchema } from "../../../schemas/helper.js";

export const outputSchema = createStructuredOutputSchema({
  id: z.string().describe("Unique identifier for the message"),
  subject: z.string().describe("Subject of the message"),
  body: z.object({
    type: z.string().describe("Content type (e.g., 'text/html')"),
    content: z.string().describe("Message body content"),
  }),
  from: z.object({
    id: z.string().describe("Sender user ID"),
    code: z.string().describe("Sender user code"),
    name: z.string().describe("Sender display name"),
  }),
  to: z.array(
    z.object({
      id: z.string().describe("Recipient user ID"),
      code: z.string().describe("Recipient user code"),
      name: z.string().describe("Recipient display name"),
    }),
  ).describe("List of message recipients"),
  createdAt: z.string().describe("Creation datetime in RFC 3339 format"),
  updatedAt: z.string().describe("Last updated datetime in RFC 3339 format"),
  isRead: z.boolean().optional().describe("Whether the message has been read"),
});
