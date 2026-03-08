import { z } from "zod";
import { getRequest } from "../../../client.js";
import { outputSchema } from "./output-schema.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import {
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types.js";

export const getBulletinCategoriesHandler = async (
  input: {
    limit?: number;
    offset?: number;
  },
  _extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
) => {
  const { limit, offset } = input;

  const params = new URLSearchParams();

  if (limit !== undefined) {
    params.append("limit", limit.toString());
  }

  if (offset !== undefined) {
    params.append("offset", offset.toString());
  }

  const query = params.toString();
  type ResponseType = z.infer<typeof outputSchema.result>;
  const data = await getRequest<ResponseType>(
    `/api/v1/bulletin/categories${query ? `?${query}` : ""}`,
  );

  const output = {
    result: data,
  };
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
