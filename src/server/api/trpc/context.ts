import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { TRPCError } from "@trpc/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createTRPCContext() {
	try {
		const cookieStore = cookies();
		const supabase = createServerComponentClient({
			cookies: () => cookieStore,
		});

		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError) {
			console.error("認証エラー:", authError);
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "認証に失敗しました",
			});
		}

		return {
			supabase,
			user,
			db: prisma,
		};
	} catch (error) {
		console.error("コンテキスト作成エラー:", error);
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "サーバーエラーが発生しました",
		});
	}
}
