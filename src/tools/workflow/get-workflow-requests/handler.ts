import { z } from "zod";
import { getRequest } from "../../../client.js";
import { outputSchema } from "./output-schema.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import {
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types.js";

type HandlerInput = {
  limit?: number;
  offset?: number;
  status?: string;
  orderBy?: {
    property: string;
    order: string;
  };
};

export const getWorkflowRequestsHandler = async (
  input: HandlerInput,
  _extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
) => {
  const { limit, offset, status, orderBy } = input;

  const params = new URLSearchParams();

  if (limit !== undefined) {
    params.set("limit", limit.toString());
  }

  if (offset !== undefined) {
    params.set("offset", offset.toString());
  }

  if (status !== undefined) {
    params.set("status", status);
  }

  if (orderBy !== undefined) {
    params.set("orderBy.property", orderBy.property);
    params.set("orderBy.order", orderBy.order);
  }

  const query = params.toString();
  const endpoint = `/api/v1/workflow/admin/requests${query ? `?${query}` : ""}`;

  type ResponseType = z.infer<typeof outputSchema.result>;
  const result = await getRequest<ResponseType>(endpoint);

  const output = { result };
  const validatedOutput = z.object(outputSchema).parse(output);

  return {
    structuredContent: validatedOutput,
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(validatedOutput, null, 2),
      },
    ],
  };
};
