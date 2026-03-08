import { z } from "zod";
import { createStructuredOutputSchema } from "../../../schemas/helper.js";

export const outputSchema = createStructuredOutputSchema({
  id: z.string(),
  subject: z.string(),
  creator: z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
  body: z.string(),
  isFollowed: z.boolean().optional(),
  canFollow: z.boolean().optional(),
});
