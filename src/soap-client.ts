/**
 * SOAP client for Garoon Bulletin API.
 * Used as fallback when the REST API returns 400 (e.g., on older on-premise instances).
 *
 * Endpoint pattern (on-premise):
 *   https://{host}/{install_path}/cbpapi/bulletin/api
 *
 * Verified working on Garoon 5.15.2 (on-premise).
 */

const rawUrl = process.env.GAROON_BASE_URL || "";
const GAROON_BASE_URL = rawUrl && /^https?:\/\//i.test(rawUrl) ? rawUrl : "";

// SOAP endpoint: {BASE_URL}/cbpapi/bulletin/api (no .csp extension)
const SOAP_BULLETIN_ENDPOINT = `${GAROON_BASE_URL}/cbpapi/bulletin/api`;

// X-Cybozu-Authorization: base64(username:password)
const API_CREDENTIAL = Buffer.from(
  `${process.env.GAROON_USERNAME}:${process.env.GAROON_PASSWORD}`,
).toString("base64");

// Optional Basic Auth
const GAROON_BASIC_AUTH_USERNAME =
  process.env.GAROON_BASIC_AUTH_USERNAME || "";
const GAROON_BASIC_AUTH_PASSWORD =
  process.env.GAROON_BASIC_AUTH_PASSWORD || "";

export interface BulletinTopicSoap {
  id: string;
  subject: string;
  body: string;
  creatorId: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
  categoryId: string;
}

/**
 * Build the SOAP envelope for BulletinGetTopicByIds.
 *
 * Parameter format (from Garoon SOAP API docs):
 *   <topics xmlns="" topic_id="ID" is_draft="false"></topics>
 */
function buildSoapEnvelope(topicId: string): string {
  const username = process.env.GAROON_USERNAME ?? "";
  const password = process.env.GAROON_PASSWORD ?? "";
  const now = new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Header>
    <Action>BulletinGetTopicByIds</Action>
    <Timestamp>
      <Created>${now}</Created>
      <Expires>2037-08-12T14:45:00Z</Expires>
    </Timestamp>
    <Locale>jp</Locale>
    <Security>
      <UsernameToken>
        <Username>${escapeXml(username)}</Username>
        <Password>${escapeXml(password)}</Password>
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

/** Unescape XML entities in attribute values / text content. */
function unescapeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#10;/g, "\n")
    .replace(/&#xA;/g, "\n");
}

/**
 * Extract an attribute value from the first occurrence of a tag in the XML.
 * Handles namespace prefixes (e.g., th:creator).
 */
function extractAttr(xml: string, tagName: string, attr: string): string {
  const re = new RegExp(
    `<(?:[^:>]+:)?${tagName}[^>]*?\\s${attr}="([^"]*)"`,
    "i",
  );
  const match = re.exec(xml);
  return match ? unescapeXml(match[1]) : "";
}

/**
 * Fetch a bulletin topic via the Garoon SOAP API.
 *
 * Response format (Garoon 5.15.2):
 * ```xml
 * <topic id="29151" subject="..." category_id="3" ...>
 *   <th:content body="本文テキスト">
 *     <th:file id="..." name="..." size="..." mime_type="..." />
 *   </th:content>
 *   <th:creator user_id="29" name="金子　直樹" date="2026-03-07T08:02:05Z" />
 *   <th:modifier user_id="29" name="金子　直樹" date="2026-03-07T08:02:05Z" />
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

  if (GAROON_BASIC_AUTH_USERNAME && GAROON_BASIC_AUTH_PASSWORD) {
    const basicCredential = Buffer.from(
      `${GAROON_BASIC_AUTH_USERNAME}:${GAROON_BASIC_AUTH_PASSWORD}`,
    ).toString("base64");
    headers["Authorization"] = `Basic ${basicCredential}`;
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

  // Check for SOAP Fault
  if (xml.includes("<soap:Fault>")) {
    const cause =
      xml.match(/<cause>([\s\S]*?)<\/cause>/)?.[1] ?? "unknown error";
    throw new Error(`Garoon SOAP fault: ${unescapeXml(cause)}`);
  }

  // Extract attributes from <topic> tag
  const id = extractAttr(xml, "topic", "id") || topicId;
  const subject = extractAttr(xml, "topic", "subject");
  const categoryId = extractAttr(xml, "topic", "category_id");

  if (!subject && !xml.includes("<topic")) {
    throw new Error(
      `SOAP response did not contain a <topic> element. Raw: ${xml.slice(0, 500)}`,
    );
  }

  // Body is an attribute on <th:content body="...">
  const body = extractAttr(xml, "content", "body");

  // Creator: <th:creator user_id="..." name="..." date="..." />
  const creatorId = extractAttr(xml, "creator", "user_id");
  const creatorName = extractAttr(xml, "creator", "name");
  const createdAt = extractAttr(xml, "creator", "date");

  // Modifier: <th:modifier user_id="..." name="..." date="..." />
  const updatedAt =
    extractAttr(xml, "modifier", "date") || createdAt;

  return {
    id,
    subject,
    body,
    creatorId,
    creatorName,
    createdAt,
    updatedAt,
    categoryId,
  };
}
