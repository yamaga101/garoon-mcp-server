import { createTool } from "../../register.js";
import { inputSchema } from "./input-schema.js";
import { outputSchema } from "./output-schema.js";
import { getNotificationsHandler } from "./handler.js";

export const getNotifications = createTool(
  "garoon-get-notifications",
  {
    title: "Get Notifications",
    description: "Retrieve a list of notifications from Garoon",
    inputSchema,
    outputSchema,
  },
  getNotificationsHandler,
);
