import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

const createTagSchema = z.object({
	name: z.string().min(1, "タグ名は必須です"),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, "有効な色コードを指定してください"),
});

const updateTagSchema = createTagSchema.extend({
	id: z.string(),
});

export const tagRouter = createTRPCRouter({
	// すべてのタグを取得
	getAll: publicProcedure.query(async ({ ctx }) => {
		try {
			if (!ctx.user) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "ログインが必要です",
				});
			}

			const { data: tags, error } = await ctx.supabase
				.from("tag")
				.select("*")
				.order("name", { ascending: true });

			if (error) {
				console.error("タグ取得エラー:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `タグの取得に失敗しました: ${error.message}`,
				});
			}

			return tags;
		} catch (error) {
			if (error instanceof TRPCError) throw error;
			console.error("予期せぬエラー:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "予期せぬエラーが発生しました",
			});
		}
	}),

	// 新しいタグを作成
	create: publicProcedure
		.input(createTagSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				if (!ctx.user) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "ログインが必要です",
					});
				}

				const { data: tag, error } = await ctx.supabase
					.from("tag")
					.insert({
						name: input.name,
						color: input.color,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					})
					.select()
					.single();

				if (error) {
					console.error("タグ作成エラー:", error);
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: `タグの作成に失敗しました: ${error.message}`,
					});
				}

				return tag;
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				console.error("予期せぬエラー:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "予期せぬエラーが発生しました",
				});
			}
		}),

	update: publicProcedure
		.input(updateTagSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				if (!ctx.user) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "ログインが必要です",
					});
				}

				const { data: tag, error } = await ctx.supabase
					.from("tag")
					.update({
						name: input.name,
						color: input.color,
						updatedAt: new Date().toISOString(),
					})
					.eq("id", input.id);

				if (error) {
					console.error("タグ更新エラー:", error);
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: `タグの更新に失敗しました: ${error.message}`,
					});
				}

				return tag;
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				console.error("予期せぬエラー:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "予期せぬエラーが発生しました",
				});
			}
		}),

	delete: publicProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			try {
				if (!ctx.user) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "ログインが必要です",
					});
				}

				// まず、このタグに関連するtodo_tagのレコードを削除
				const { error: todoTagError } = await ctx.supabase
					.from("todo_tag")
					.delete()
					.eq("tag_id", input.id);

				if (todoTagError) {
					console.error("todo_tag削除エラー:", todoTagError);
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: `タグの関連付けの削除に失敗しました: ${todoTagError.message}`,
					});
				}

				// 次に、タグ自体を削除
				const { error } = await ctx.supabase
					.from("tag")
					.delete()
					.eq("id", input.id);

				if (error) {
					console.error("タグ削除エラー:", error);
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: `タグの削除に失敗しました: ${error.message}`,
					});
				}

				return { success: true };
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				console.error("予期せぬエラー:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "予期せぬエラーが発生しました",
				});
			}
		}),
});
