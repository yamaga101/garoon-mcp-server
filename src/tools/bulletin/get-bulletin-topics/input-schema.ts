import { z } from "zod";
import { limitSchema, offsetSchema } from "../../../schemas/base/index.js";

export const inputSchema = {
  categoryId: z.string().describe("Category ID to get topics from"),
  limit: limitSchema(),
  offset: offsetSchema(),
};
