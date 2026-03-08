import { z } from "zod";
import { hasNextSchema } from "../../../schemas/base/index.js";
import { createStructuredOutputSchema } from "../../../schemas/helper.js";

export const outputSchema = createStructuredOutputSchema({
  topics: z
    .array(
      z.object({
        id: z.string(),
        subject: z.string(),
        creator: z.object({
          id: z.string(),
          code: z.string(),
          name: z.string(),
        }),
        createdAt: z.string(),
        updatedAt: z.string(),
        body: z.string().optional(),
        canFollow: z.boolean().optional(),
        isFollowed: z.boolean().optional(),
      }),
    )
    .describe("List of bulletin topics in the category"),
  hasNext: hasNextSchema(),
});
