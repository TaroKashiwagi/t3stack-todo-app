"use client";

import { useState } from "react";
import { useAuth } from "../_lib/auth";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

export default function ResetPasswordPage() {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { resetPassword } = useAuth();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			await resetPassword(email);
			toast.success(
				<div className="space-y-2">
					<p className="font-medium">
						パスワードリセットメールを送信しました
					</p>
					<p className="text-sm">
						メールアドレスに送信されたリンクから、新しいパスワードを設定してください。
					</p>
				</div>,
				{
					duration: 6000,
					position: "top-center",
					style: {
						background: "#fff",
						color: "#1f2937",
						padding: "16px",
						borderRadius: "8px",
						boxShadow:
							"0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
					},
				}
			);
			setEmail("");
		} catch (error) {
			console.error("Reset password error:", error);
			toast.error(
				"パスワードリセットメールの送信に失敗しました。メールアドレスを確認してください。",
				{
					duration: 4000,
					position: "top-center",
				}
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<Toaster />
			<div className="max-w-md w-full space-y-8">
				<div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
						パスワードのリセット
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600">
						登録したメールアドレスを入力してください。
						パスワードリセット用のリンクを送信します。
					</p>
				</div>
				<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
					<div>
						<label htmlFor="email" className="sr-only">
							メールアドレス
						</label>
						<input
							id="email"
							name="email"
							type="email"
							autoComplete="email"
							required
							className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
							placeholder="メールアドレス"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</div>

					<div>
						<button
							type="submit"
							disabled={isLoading}
							className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? "送信中..." : "リセットリンクを送信"}
						</button>
					</div>

					<div className="text-sm text-center">
						<Link
							href="/login"
							className="font-medium text-indigo-600 hover:text-indigo-500"
						>
							ログインページに戻る
						</Link>
					</div>
				</form>
			</div>
		</div>
	);
}
