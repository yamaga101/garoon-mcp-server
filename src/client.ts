import {
  GAROON_BASE_URL,
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
