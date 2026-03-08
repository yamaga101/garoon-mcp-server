import { createTool } from "../../register.js";
import { inputSchema } from "./input-schema.js";
import { outputSchema } from "./output-schema.js";
import { getWorkflowRequestsHandler } from "./handler.js";

export const getWorkflowRequests = createTool(
  "garoon-get-workflow-requests",
  {
    title: "Get Workflow Requests",
    description:
      "Retrieve a list of workflow requests from Garoon (admin endpoint)",
    inputSchema,
    outputSchema,
  },
  getWorkflowRequestsHandler,
);
