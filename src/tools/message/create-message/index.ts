import { createTool } from "../../register.js";
import { inputSchema } from "./input-schema.js";
import { outputSchema } from "./output-schema.js";
import { createMessageHandler } from "./handler.js";

export const createMessage = createTool(
  "garoon-create-message",
  {
    title: "Create Message",
    description:
      "Create and send a new message in Garoon Messages via SOAP API. Specify recipients by user ID or code.",
    inputSchema,
    outputSchema,
  },
  createMessageHandler,
);
