import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

/**
 * Standard success response structure
 */
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

/**
 * Standard error response structure
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

/**
 * Create a standardized success response
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @param headers - Additional headers to include
 * @returns NextResponse with standardized format
 */
export function successResponse<T>(
  data: T,
  status = 200,
  headers?: Record<string, string>
): NextResponse<SuccessResponse<T>> {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: uuidv4(),
    },
  };

  return NextResponse.json(response, { status, headers });
}

/**
 * Create a standardized error response
 * @param code - Error code (e.g., "INSUFFICIENT_CREDITS")
 * @param message - Human-readable error message
 * @param status - HTTP status code (default: 500)
 * @param details - Additional error details
 * @param headers - Additional headers to include
 * @returns NextResponse with standardized error format
 */
export function errorResponse(
  code: string,
  message: string,
  status = 500,
  details?: Record<string, unknown>,
  headers?: Record<string, string>
): NextResponse<ErrorResponse> {
  const response: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: uuidv4(),
    },
  };

  return NextResponse.json(response, { status, headers });
}

/**
 * Apply Set-Cookie headers to response
 * Helper for Supabase cookie handling
 */
export function withCookies<T>(
  response: NextResponse<T>,
  cookies: Array<{ name: string; value: string; options?: unknown }>
): NextResponse<T> {
  cookies.forEach(({ name, value }) => {
    response.headers.append("Set-Cookie", `${name}=${value}`);
  });
  return response;
}
