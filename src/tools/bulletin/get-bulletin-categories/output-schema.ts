import { z } from "zod";
import { hasNextSchema } from "../../../schemas/base/index.js";
import { createStructuredOutputSchema } from "../../../schemas/helper.js";

export const outputSchema = createStructuredOutputSchema({
  categories: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        parentCategory: z.string().nullable().optional(),
        childCategories: z.array(z.string()).optional(),
        creatorName: z.string().optional(),
      }),
    )
    .describe("List of bulletin board categories"),
  hasNext: hasNextSchema(),
});
