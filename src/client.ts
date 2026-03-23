import {
  GAROON_BASE_URL,
  GAROON_USERNAME,
  GAROON_PASSWORD,
  API_CREDENTIAL,
  USER_AGENT,
  BASIC_AUTH_HEADER,
} from "./config.js";

// Base headers for Garoon API
const BASE_HEADERS: Record<string, string> = {
  "X-Cybozu-Authorization": API_CREDENTIAL,
  "User-Agent": USER_AGENT,
};

if (BASIC_AUTH_HEADER) {
  BASE_HEADERS.Authorization = BASIC_AUTH_HEADER;
}

export class HttpErrorResponse extends Error {
  constructor(
    public status: number,
    public responseText: string,
  ) {
    super(`HTTP Error ${status}: ${responseText}`);
    this.name = "HttpErrorResponse";
  }
}

export async function postRequest<T>(
  endpoint: string,
  body: string,
): Promise<T> {
  const requestUrl = `${GAROON_BASE_URL}${endpoint}`;
  const response = await fetch(requestUrl, {
    method: "POST",
    headers: {
      ...BASE_HEADERS,
      "Content-Type": "application/json",
    },
    body,
  });
  if (response.ok) {
    return response.json() as T;
  }
  const responseText = await response.text();
  throw new HttpErrorResponse(response.status, responseText);
}

/**
 * Send a SOAP 1.2 request to the Garoon SOAP API.
 * @param apiPath  SOAP API path segment, e.g. "message"
 * @param action   SOAP action name, e.g. "MessageCreateThreads"
 * @param bodyXml  Inner XML for <soap:Body> (without the Body wrapper)
 * @returns Raw XML response body as string
 */
export async function soapRequest(
  apiPath: string,
  action: string,
  bodyXml: string,
): Promise<string> {
  const now = new Date();
  const expires = new Date(now.getTime() + 60 * 60 * 1000);
  const created = now.toISOString().replace(/\.\d{3}Z$/, "Z");
  const expiresStr = expires.toISOString().replace(/\.\d{3}Z$/, "Z");

  const envelope = `<?xml version="1.0" encoding="UTF-8"?>\
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">\
<soap:Header>\
<Action>${action}</Action>\
<Timestamp><Created>${created}</Created><Expires>${expiresStr}</Expires></Timestamp>\
<Locale>jp</Locale>\
<Security><UsernameToken>\
<Username>${escapeXml(GAROON_USERNAME)}</Username>\
<Password>${escapeXml(GAROON_PASSWORD)}</Password>\
</UsernameToken></Security>\
</soap:Header>\
<soap:Body>${bodyXml}</soap:Body>\
</soap:Envelope>`;

  const requestUrl = `${GAROON_BASE_URL}/cbpapi/${apiPath}/api?`;
  const response = await fetch(requestUrl, {
    method: "POST",
    headers: {
      ...BASE_HEADERS,
      "Content-Type": `application/soap+xml; charset=UTF-8; action="${action}"`,
    },
    body: envelope,
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new HttpErrorResponse(response.status, responseText);
  }
  // Check for SOAP Fault
  if (responseText.includes("<soap:Fault>")) {
    throw new Error(`SOAP Fault: ${responseText}`);
  }
  return responseText;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function getRequest<T>(endpoint: string): Promise<T> {
  const requestUrl = `${GAROON_BASE_URL}${endpoint}`;
  const response = await fetch(requestUrl, {
    method: "GET",
    headers: {
      ...BASE_HEADERS,
    },
  });
  if (response.ok) {
    return response.json() as T;
  }
  const responseText = await response.text();
  throw new HttpErrorResponse(response.status, responseText);
}
