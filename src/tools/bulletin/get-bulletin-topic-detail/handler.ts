import { z } from "zod";
import { getRequest, HttpErrorResponse } from "../../../client.js";
import { getBulletinTopicBySoap } from "../../../soap-client.js";
import { outputSchema } from "./output-schema.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import {
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types.js";

export const getBulletinTopicDetailHandler = async (
  input: {
    topicId: string;
  },
  _extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
) => {
  const { topicId } = input;

  type ResponseType = z.infer<typeof outputSchema.result>;

  let data: ResponseType;

  try {
    data = await getRequest<ResponseType>(
      `/api/v1/bulletin/topics/${topicId}`,
    );
  } catch (err) {
    // Fall back to SOAP when the REST endpoint returns 400
    // (common on older Garoon on-premise instances)
    if (err instanceof HttpErrorResponse && err.status === 400) {
      const soapTopic = await getBulletinTopicBySoap(topicId);
      data = {
        id: soapTopic.id,
        subject: soapTopic.subject,
        body: soapTopic.body,
        creator: {
          id: soapTopic.creatorId,
          code: soapTopic.creatorId,
          name: soapTopic.creatorName,
        },
        createdAt: soapTopic.createdAt,
        updatedAt: soapTopic.updatedAt,
      };
    } else {
      throw err;
    }
  }

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
