import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const todoRouter = createTRPCRouter({
	// タスク一覧を取得
	getAll: protectedProcedure.query(async ({ ctx }) => {
		const todos = await ctx.db.todo.findMany({
			where: {
				userId: ctx.user.id,
			},
			include: {
				tags: true,
			},
			orderBy: [
				{
					status: "asc",
				},
				{
					order: "asc",
				},
			],
		});
		return todos;
	}),

	// タスクを作成
	create: protectedProcedure
		.input(
			z.object({
				title: z.string().min(1),
				description: z.string().optional(),
				dueDate: z.date().optional(),
				priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
				category: z.string().optional(),
				tagIds: z.array(z.string()).optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const lastTodo = await ctx.db.todo.findFirst({
				where: {
					userId: ctx.user.id,
					status: "TODO",
				},
				orderBy: {
					order: "desc",
				},
			});

			const todo = await ctx.db.todo.create({
				data: {
					title: input.title,
					description: input.description,
					dueDate: input.dueDate,
					priority: input.priority,
					category: input.category,
					userId: ctx.user.id,
					order: lastTodo ? lastTodo.order + 1 : 0,
					status: "TODO",
					tags: input.tagIds
						? {
								connect: input.tagIds.map((id) => ({ id })),
						  }
						: undefined,
				},
				include: {
					tags: true,
				},
			});
			return todo;
		}),

	// タスクを更新
	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().optional(),
				description: z.string().optional(),
				completed: z.boolean().optional(),
				dueDate: z.date().optional(),
				status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
				order: z.number().optional(),
				tagIds: z.array(z.string()).optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const todo = await ctx.db.todo.findUnique({
				where: { id: input.id },
			});

			if (!todo) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Todo not found",
				});
			}

			if (todo.userId !== ctx.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Not authorized",
				});
			}

			const updatedTodo = await ctx.db.todo.update({
				where: { id: input.id },
				data: {
					title: input.title,
					description: input.description,
					completed: input.completed,
					dueDate: input.dueDate,
					status: input.status,
					order: input.order,
					tags: input.tagIds
						? {
								set: input.tagIds.map((id) => ({ id })),
						  }
						: undefined,
				},
				include: {
					tags: true,
				},
			});

			return updatedTodo;
		}),

	// タスクを削除
	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const todo = await ctx.db.todo.findUnique({
				where: { id: input.id },
			});

			if (!todo) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Todo not found",
				});
			}

			if (todo.userId !== ctx.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Not authorized",
				});
			}

			await ctx.db.todo.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),

	// タスクの並び順を更新
	reorder: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
				order: z.number(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, status, order } = input;

			const todo = await ctx.db.todo.findUnique({
				where: { id },
			});

			if (!todo) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "タスクが見つかりません",
				});
			}

			if (todo.userId !== ctx.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "このタスクを編集する権限がありません",
				});
			}

			// 同じステータス内の他のタスクの順序を更新
			await ctx.db.todo.updateMany({
				where: {
					userId: ctx.user.id,
					status,
					order: {
						gte: order,
					},
					id: {
						not: id,
					},
				},
				data: {
					order: {
						increment: 1,
					},
				},
			});

			const updatedTodo = await ctx.db.todo.update({
				where: { id },
				data: {
					status,
					order,
				},
			});

			return updatedTodo;
		}),
});
