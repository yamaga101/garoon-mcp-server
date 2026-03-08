import { getBulletinCategoriesTool } from "./get-bulletin-categories/index.js";
import { getBulletinTopicsTool } from "./get-bulletin-topics/index.js";
import { getBulletinTopicDetailTool } from "./get-bulletin-topic-detail/index.js";

export const bulletinTools = [
  getBulletinCategoriesTool,
  getBulletinTopicsTool,
  getBulletinTopicDetailTool,
];
