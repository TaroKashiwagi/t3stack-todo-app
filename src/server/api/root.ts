import { createTRPCRouter } from "@/server/api/trpc";
import { todoRouter } from "@/server/api/routers/todo";
import { tagRouter } from "@/server/api/routers/tag";

export const appRouter = createTRPCRouter({
	todo: todoRouter,
	tag: tagRouter,
});

export type AppRouter = typeof appRouter;
