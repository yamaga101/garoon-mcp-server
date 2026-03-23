import { z } from "zod";

export const inputSchema = {
  subject: z.string().describe("Subject/title of the message"),
  body: z.string().describe("Message body content (plain text)"),
  to: z
    .array(
      z.object({
        type: z
          .enum(["USER"])
          .describe("Recipient type"),
        id: z
          .string()
          .optional()
          .describe("User ID (numeric string). If both id and code are provided, id is used."),
        code: z
          .string()
          .optional()
          .describe("User login code. Used when id is not provided."),
      }),
    )
    .describe("List of message recipients"),
};
