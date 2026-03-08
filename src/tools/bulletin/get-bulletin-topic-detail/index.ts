import { createTool } from "../../register.js";
import { inputSchema } from "./input-schema.js";
import { outputSchema } from "./output-schema.js";
import { getBulletinTopicDetailHandler } from "./handler.js";

export const getBulletinTopicDetailTool = createTool(
  "garoon-get-bulletin-topic-detail",
  {
    title: "Get Bulletin Topic Detail",
    description:
      "Get detailed information of a specific bulletin board topic in Garoon, including the full body content and follow status.",
    inputSchema,
    outputSchema,
  },
  getBulletinTopicDetailHandler,
);
