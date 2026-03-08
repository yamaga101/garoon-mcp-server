import { createTool } from "../../register.js";
import { inputSchema } from "./input-schema.js";
import { outputSchema } from "./output-schema.js";
import { getBulletinTopicsHandler } from "./handler.js";

export const getBulletinTopicsTool = createTool(
  "garoon-get-bulletin-topics",
  {
    title: "Get Bulletin Topics",
    description:
      "Get a list of topics in a specific bulletin board category in Garoon - supports pagination with optional limit and offset parameters.",
    inputSchema,
    outputSchema,
  },
  getBulletinTopicsHandler,
);
