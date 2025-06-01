import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc/context";
import { NextRequest } from "next/server";

const handler = (req: Request) =>
	fetchRequestHandler({
		endpoint: "/api/trpc",
		req: req as unknown as NextRequest,
		router: appRouter,
		createContext: () => createTRPCContext(),
	});

export { handler as GET, handler as POST };
