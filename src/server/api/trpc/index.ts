import { createTRPCContext } from "@/server/api/trpc/context";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { TRPCError } from "@trpc/server";

const t = initTRPC.context<typeof createTRPCContext>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError:
					error.cause instanceof ZodError
						? error.cause.flatten()
						: null,
			},
		};
	},
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "認証が必要です",
		});
	}
	return next({
		ctx: {
			user: ctx.user,
			supabase: ctx.supabase,
		},
	});
});
