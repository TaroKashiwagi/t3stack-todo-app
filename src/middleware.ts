import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
	const res = NextResponse.next();
	const supabase = createMiddlewareClient({ req, res });

	const {
		data: { session },
	} = await supabase.auth.getSession();

	// 認証が必要なパス
	const authRequiredPaths = ["/todos"];

	// 認証済みユーザーがアクセスできないパス
	const authRedirectPaths = ["/login", "/signup"];

	const isAuthRequiredPath = authRequiredPaths.some((path) =>
		req.nextUrl.pathname.startsWith(path)
	);
	const isAuthRedirectPath = authRedirectPaths.some((path) =>
		req.nextUrl.pathname.startsWith(path)
	);

	// 認証が必要なパスに未認証でアクセスした場合
	if (isAuthRequiredPath && !session) {
		const redirectUrl = new URL("/login", req.url);
		redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
		return NextResponse.redirect(redirectUrl);
	}

	// 認証済みユーザーがログインページなどにアクセスした場合
	if (isAuthRedirectPath && session) {
		return NextResponse.redirect(new URL("/todos", req.url));
	}

	return res;
}

export const config = {
	matcher: ["/todos/:path*", "/login", "/signup"],
};
