import { z } from "zod";

export const inputSchema = {
  messageId: z.string().describe("Message ID to retrieve"),
};
