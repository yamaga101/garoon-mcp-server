import { limitSchema, offsetSchema } from "../../../schemas/base/index.js";

export const inputSchema = {
  limit: limitSchema(),
  offset: offsetSchema(),
};
