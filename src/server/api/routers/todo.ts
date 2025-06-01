import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

const createTodoSchema = z.object({
	title: z.string().min(1, "タイトルは必須です"),
	description: z.string().optional(),
	dueDate: z.date().optional(),
	priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
	category: z.string().optional(),
	tagIds: z.array(z.string()).optional(),
});

interface TodoTag {
	tag: {
		id: string;
		name: string;
		color: string;
	};
}

export const todoRouter = createTRPCRouter({
	// すべてのTodoを取得
	getAll: publicProcedure.query(async ({ ctx }) => {
		try {
			const { data: todos, error } = await ctx.supabase
				.from("todo")
				.select("*, tags:todo_tag(tag:tag(*))")
				.order("createdAt", { ascending: false });

			if (error) {
				console.error("Todo取得エラー:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: `Todoの取得に失敗しました: ${error.message}`,
				});
			}

			// ステータスと順序のデフォルト値を設定
			return todos.map((todo) => ({
				...todo,
				status: todo.status || "TODO",
				order: todo.order || 0,
				tags: todo.tags?.map((t: TodoTag) => t.tag) ?? [],
			}));
		} catch (error) {
			if (error instanceof TRPCError) throw error;
			console.error("予期せぬエラー:", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "予期せぬエラーが発生しました",
			});
		}
	}),

	// 新しいTodoを作成
	create: publicProcedure
		.input(createTodoSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const { data: todo, error } = await ctx.supabase
					.from("todo")
					.insert({
						title: input.title,
						description: input.description,
						dueDate: input.dueDate
							? new Date(input.dueDate).toISOString()
							: null,
						priority: input.priority,
						category: input.category,
						completed: false,
						status: "TODO",
						order: 0,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					})
					.select()
					.single();

				if (error) {
					console.error("Todo作成エラー:", error);
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: `Todoの作成に失敗しました: ${error.message}`,
					});
				}

				return todo;
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				console.error("予期せぬエラー:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "予期せぬエラーが発生しました",
				});
			}
		}),

	// Todoを更新
	update: publicProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().optional(),
				description: z.string().optional(),
				dueDate: z.date().optional(),
				completed: z.boolean().optional(),
				status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
				order: z.number().optional(),
				tagIds: z.array(z.string()).optional(),
				priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
				category: z.string().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const { error } = await ctx.supabase
					.from("todo")
					.update({
						...(input.title && { title: input.title }),
						...(input.description !== undefined && {
							description: input.description,
						}),
						...(input.dueDate && {
							dueDate: new Date(input.dueDate).toISOString(),
						}),
						...(input.completed !== undefined && {
							completed: input.completed,
						}),
						...(input.status && { status: input.status }),
						...(input.order !== undefined && {
							order: input.order,
						}),
						...(input.priority && { priority: input.priority }),
						...(input.category !== undefined && {
							category: input.category,
						}),
						updatedAt: new Date().toISOString(),
					})
					.eq("id", input.id);

				if (error) {
					console.error("Todo更新エラー:", error);
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Todoの更新に失敗しました",
					});
				}

				// タグの関連付けを更新
				if (input.tagIds !== undefined) {
					// 既存のタグ関連付けを削除
					await ctx.supabase
						.from("todo_tag")
						.delete()
						.eq("todo_id", input.id);

					// 新しいタグ関連付けを作成
					if (input.tagIds.length > 0) {
						const { error: tagError } = await ctx.supabase
							.from("todo_tag")
							.insert(
								input.tagIds.map((tagId) => ({
									todo_id: input.id,
									tag_id: tagId,
								}))
							);

						if (tagError) {
							console.error("タグ更新エラー:", tagError);
							throw new TRPCError({
								code: "INTERNAL_SERVER_ERROR",
								message: "タグの更新に失敗しました",
							});
						}
					}
				}

				// 更新されたタスクを取得（タグ情報を含む）
				const { data: updatedTodo, error: fetchError } =
					await ctx.supabase
						.from("todo")
						.select("*, tags:todo_tag(tag:tag(*))")
						.eq("id", input.id)
						.single();

				if (fetchError) {
					console.error("更新後のTodo取得エラー:", fetchError);
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "更新後のTodoの取得に失敗しました",
					});
				}

				// タグ情報を整形
				return {
					...updatedTodo,
					tags: updatedTodo.tags?.map((t: TodoTag) => t.tag) ?? [],
				};
			} catch (error) {
				if (error instanceof TRPCError) throw error;
				console.error("予期せぬエラー:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "予期せぬエラーが発生しました",
				});
			}
		}),

	// Todoを削除
	delete: publicProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			try {
				const { error } = await ctx.supabase
					.from("todo")
					.delete()
					.eq("id", input.id);

				if (error) {
					console.error("Todo削除エラー:", error);
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Todoの削除に失敗しました",
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
