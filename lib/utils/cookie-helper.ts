/**
 * Helper utility to properly set cookies in API responses
 */

import { serialize, type SerializeOptions } from "cookie";

export interface CookieToSet {
  name: string;
  value: string;
  options?: any;
}

/**
 * Append cookies to response headers with proper serialization
 * @param response NextResponse instance
 * @param cookies Array of cookies to set
 */
export function appendCookies(response: Response, cookies: CookieToSet[]) {
  cookies.forEach(({ name, value, options }) => {
    const defaultOptions: SerializeOptions = {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    };

    const mergedOptions = { ...defaultOptions, ...options };
    const serialized = serialize(name, value, mergedOptions);

    response.headers.append("Set-Cookie", serialized);
  });
}
