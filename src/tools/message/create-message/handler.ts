import { z } from "zod";
import { soapRequest } from "../../../client.js";
import { outputSchema } from "./output-schema.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import {
  ServerNotification,
  ServerRequest,
} from "@modelcontextprotocol/sdk/types.js";

type HandlerInput = {
  subject: string;
  body: string;
  to: Array<{
    type: "USER";
    id?: string;
    code?: string;
  }>;
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeXmlAttr(str: string): string {
  return escapeXml(str).replace(/\n/g, "&#10;");
}

function parseAttr(xml: string, tag: string, attr: string): string {
  const re = new RegExp(`<[^>]*?${tag}[^>]*?${attr}="([^"]*)"`, "i");
  const m = xml.match(re);
  return m ? m[1] : "";
}

export const createMessageHandler = async (
  input: HandlerInput,
  _extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
) => {
  const { subject, body, to } = input;

  const addressees = to
    .map((r) => {
      const id = r.id ?? "";
      return `<addressee user_id="${escapeXml(id)}" name="" deleted="false"></addressee>`;
    })
    .join("");

  const innerXml =
    `<MessageCreateThreads xmlns="http://wsdl.cybozu.co.jp/message/2008">` +
    `<parameters><create_thread>` +
    `<thread id="dummy" version="dummy" subject="${escapeXmlAttr(subject)}" confirm="false">` +
    addressees +
    `<content body="${escapeXmlAttr(body)}"></content>` +
    `<folder id="dummy"></folder>` +
    `</thread>` +
    `</create_thread></parameters>` +
    `</MessageCreateThreads>`;

  const responseXml = await soapRequest("message", "MessageCreateThreads", innerXml);

  // Parse key fields from SOAP response
  const threadId = parseAttr(responseXml, "thread", "id");
  const threadSubject = parseAttr(responseXml, "thread", "subject");

  const output = {
    result: {
      id: threadId,
      subject: threadSubject,
      status: "sent",
    },
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
