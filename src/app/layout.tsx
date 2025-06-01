import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./_lib/auth";
import { TRPCProvider } from "./_trpc/Provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Todo App",
	description: "",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="ja">
			<body className={inter.className}>
				<TRPCProvider>
					<AuthProvider>{children}</AuthProvider>
				</TRPCProvider>
				<Toaster />
			</body>
		</html>
	);
}
