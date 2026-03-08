import { createTool } from "../../register.js";
import { inputSchema } from "./input-schema.js";
import { outputSchema } from "./output-schema.js";
import { getMessageHandler } from "./handler.js";

export const getMessage = createTool(
  "garoon-get-message",
  {
    title: "Get Message",
    description: "Get a specific message detail from Garoon Messages",
    inputSchema,
    outputSchema,
  },
  getMessageHandler,
);
