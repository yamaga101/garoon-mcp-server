/**
 * Shared configuration for Garoon API clients (REST + SOAP).
 * Single source of truth for base URL, credentials, and auth headers.
 */

import { VERSION, EXECUTION_TYPE } from "./build-constants.js";

const rawUrl = process.env.GAROON_BASE_URL || "";

export const GAROON_BASE_URL =
  rawUrl && /^https?:\/\//i.test(rawUrl) ? rawUrl : "";

export const GAROON_USERNAME = process.env.GAROON_USERNAME ?? "";
export const GAROON_PASSWORD = process.env.GAROON_PASSWORD ?? "";

/** X-Cybozu-Authorization: base64(username:password) */
export const API_CREDENTIAL = Buffer.from(
  `${GAROON_USERNAME}:${GAROON_PASSWORD}`,
).toString("base64");

export const USER_AGENT = `garoon-mcp-server/${VERSION} (${EXECUTION_TYPE})`;

// Optional Basic Auth
const basicUsername = process.env.GAROON_BASIC_AUTH_USERNAME || "";
const basicPassword = process.env.GAROON_BASIC_AUTH_PASSWORD || "";

export const BASIC_AUTH_HEADER: string | undefined =
  basicUsername && basicPassword
    ? `Basic ${Buffer.from(`${basicUsername}:${basicPassword}`).toString("base64")}`
    : undefined;
