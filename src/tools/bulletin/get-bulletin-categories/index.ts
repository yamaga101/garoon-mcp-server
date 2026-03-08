import { createTool } from "../../register.js";
import { inputSchema } from "./input-schema.js";
import { outputSchema } from "./output-schema.js";
import { getBulletinCategoriesHandler } from "./handler.js";

export const getBulletinCategoriesTool = createTool(
  "garoon-get-bulletin-categories",
  {
    title: "Get Bulletin Categories",
    description:
      "Get a list of bulletin board categories in Garoon - supports pagination with optional limit and offset parameters.",
    inputSchema,
    outputSchema,
  },
  getBulletinCategoriesHandler,
);
