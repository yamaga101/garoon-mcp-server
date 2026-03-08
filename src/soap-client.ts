/**
 * SOAP client for Garoon Bulletin API.
 * Used as fallback when the REST API returns 400/404/405
 * (e.g., on older on-premise instances).
 *
 * Endpoint pattern (on-premise):
 *   https://{host}/{install_path}/cbpapi/bulletin/api
 *
 * Verified working on Garoon 5.15.2 (on-premise).
 */

import { XMLParser } from "fast-xml-parser";
import {
  GAROON_BASE_URL,
  GAROON_USERNAME,
  GAROON_PASSWORD,
  API_CREDENTIAL,
  BASIC_AUTH_HEADER,
} from "./config.js";

// SOAP endpoint: {BASE_URL}/cbpapi/bulletin/api (no .csp extension)
const SOAP_BULLETIN_ENDPOINT = `${GAROON_BASE_URL}/cbpapi/bulletin/api`;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseAttributeValue: false,
});

export interface BulletinTopicSoap {
  id: string;
  subject: string;
  body: string;
  creatorId: string;
  creatorName: string;
  creatorLoginName: string;
  createdAt: string;
  updatedAt: string;
  categoryId: string;
}

/**
 * Build the SOAP envelope for BulletinGetTopicByIds.
 * Expires is set to now + 10 minutes (dynamic).
 */
function buildSoapEnvelope(topicId: string): string {
  const now = new Date();
  const expires = new Date(now.getTime() + 10 * 60 * 1000);

  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Header>
    <Action>BulletinGetTopicByIds</Action>
    <Timestamp>
      <Created>${now.toISOString()}</Created>
      <Expires>${expires.toISOString()}</Expires>
    </Timestamp>
    <Locale>jp</Locale>
    <Security>
      <UsernameToken>
        <Username>${escapeXml(GAROON_USERNAME)}</Username>
        <Password>${escapeXml(GAROON_PASSWORD)}</Password>
      </UsernameToken>
    </Security>
  </soap:Header>
  <soap:Body>
    <BulletinGetTopicByIds>
      <parameters>
        <topics xmlns="" topic_id="${escapeXml(topicId)}" is_draft="false"></topics>
      </parameters>
    </BulletinGetTopicByIds>
  </soap:Body>
</soap:Envelope>`;
}

/** Minimal XML escape for values embedded in the SOAP envelope. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Navigate into a parsed XML object, handling namespace prefixes.
 * Tries both `ns:tagName` and plain `tagName`.
 */
function findTag(obj: Record<string, unknown>, tagName: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  // Direct match
  if (tagName in obj) return obj[tagName];
  // Namespace-prefixed match (e.g., th:content)
  for (const key of Object.keys(obj)) {
    if (key.endsWith(`:${tagName}`)) return obj[key];
  }
  return undefined;
}

/**
 * Fetch a bulletin topic via the Garoon SOAP API.
 *
 * Response format (Garoon 5.15.2):
 * ```xml
 * <topic id="29151" subject="..." category_id="3" ...>
 *   <th:content body="...">
 *     <th:file id="..." name="..." size="..." mime_type="..." />
 *   </th:content>
 *   <th:creator user_id="29" name="..." login_name="..." date="..." />
 *   <th:modifier user_id="29" name="..." login_name="..." date="..." />
 * </topic>
 * ```
 */
export async function getBulletinTopicBySoap(
  topicId: string,
): Promise<BulletinTopicSoap> {
  const envelope = buildSoapEnvelope(topicId);

  const headers: Record<string, string> = {
    "Content-Type": "application/soap+xml; charset=utf-8",
    "X-Cybozu-Authorization": API_CREDENTIAL,
  };

  if (BASIC_AUTH_HEADER) {
    headers.Authorization = BASIC_AUTH_HEADER;
  }

  const response = await fetch(SOAP_BULLETIN_ENDPOINT, {
    method: "POST",
    headers,
    body: envelope,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `SOAP request failed with status ${response.status}: ${text}`,
    );
  }

  const xml = await response.text();
  const parsed = xmlParser.parse(xml);

  // Navigate: soap:Envelope > soap:Body > BulletinGetTopicByIdsResponse > returns > topic
  const envelope_ = findTag(
    parsed as Record<string, unknown>,
    "Envelope",
  ) as Record<string, unknown> | undefined;
  const body = findTag(envelope_ ?? {}, "Body") as
    | Record<string, unknown>
    | undefined;

  // Check for SOAP Fault
  const fault = findTag(body ?? {}, "Fault") as
    | Record<string, unknown>
    | undefined;
  if (fault) {
    const reason = findTag(fault, "Reason") as
      | Record<string, unknown>
      | undefined;
    const text_ = findTag(reason ?? {}, "Text");
    throw new Error(`Garoon SOAP fault: ${String(text_ ?? "unknown error")}`);
  }

  const responseTag = findTag(
    body ?? {},
    "BulletinGetTopicByIdsResponse",
  ) as Record<string, unknown> | undefined;
  const returns = findTag(responseTag ?? {}, "returns") as
    | Record<string, unknown>
    | undefined;
  const topic = findTag(returns ?? {}, "topic") as
    | Record<string, unknown>
    | undefined;

  if (!topic) {
    throw new Error(
      `SOAP response did not contain a <topic> element. Raw: ${xml.slice(0, 500)}`,
    );
  }

  const id = String(topic["@_id"] ?? topicId);
  const subject = String(topic["@_subject"] ?? "");
  const categoryId = String(topic["@_category_id"] ?? "");

  // Body: <th:content body="...">
  const content = findTag(topic, "content") as
    | Record<string, unknown>
    | undefined;
  const bodyText = String(content?.["@_body"] ?? "");

  // Creator: <th:creator user_id="..." name="..." login_name="..." date="..." />
  const creator = findTag(topic, "creator") as
    | Record<string, unknown>
    | undefined;
  const creatorId = String(creator?.["@_user_id"] ?? "");
  const creatorName = String(creator?.["@_name"] ?? "");
  const creatorLoginName = String(creator?.["@_login_name"] ?? creatorId);
  const createdAt = String(creator?.["@_date"] ?? "");

  // Modifier: <th:modifier user_id="..." name="..." date="..." />
  const modifier = findTag(topic, "modifier") as
    | Record<string, unknown>
    | undefined;
  const updatedAt = String(modifier?.["@_date"] ?? createdAt);

  return {
    id,
    subject,
    body: bodyText,
    creatorId,
    creatorName,
    creatorLoginName,
    createdAt,
    updatedAt,
    categoryId,
  };
}
