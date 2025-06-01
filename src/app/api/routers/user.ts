import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
	create: publicProcedure
		.input(
			z.object({
				email: z
					.string()
					.email("有効なメールアドレスを入力してください"),
				name: z.string().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			try {
				// メールアドレスの重複チェック
				const { data: existingUser, error: findError } =
					await ctx.supabase
						.from("users")
						.select("*")
						.eq("email", input.email)
						.single();

				if (findError && findError.code !== "PGRST116") {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "ユーザー検索に失敗しました",
					});
				}

				if (existingUser) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "このメールアドレスは既に使用されています",
					});
				}

				const { data: user, error: createError } = await ctx.supabase
					.from("users")
					.insert(input)
					.select()
					.single();

				if (createError) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "ユーザーの作成に失敗しました",
					});
				}

				return user;
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "ユーザーの作成に失敗しました",
					cause: error,
				});
			}
		}),

	getByEmail: publicProcedure
		.input(z.object({ email: z.string().email() }))
		.query(async ({ ctx, input }) => {
			try {
				const { data: user, error } = await ctx.supabase
					.from("users")
					.select("*")
					.eq("email", input.email)
					.single();

				if (error) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "ユーザーが見つかりません",
					});
				}

				return user;
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "ユーザーの取得に失敗しました",
					cause: error,
				});
			}
		}),
});
