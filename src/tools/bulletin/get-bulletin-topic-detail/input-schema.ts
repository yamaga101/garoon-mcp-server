import { z } from "zod";

export const inputSchema = {
  topicId: z.string().describe("Topic ID to get details for"),
};
