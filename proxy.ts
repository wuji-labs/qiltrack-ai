import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Propagate pathname to server components so slug can be recovered reliably.
export function proxy(request: NextRequest) {
	const headers = new Headers(request.headers);
	headers.set("x-pathname", request.nextUrl.pathname);
	return NextResponse.next({
		request: { headers },
	});
}
