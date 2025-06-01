"use client";

import { useState, useMemo } from "react";
import { useAuth } from "../_lib/auth";
import Link from "next/link";
import { z } from "zod";
import {
	CheckCircleIcon,
	XCircleIcon,
	EyeIcon,
	EyeSlashIcon,
} from "@heroicons/react/24/solid";
import toast, { Toaster } from "react-hot-toast";

const passwordSchema = z.object({
	password: z
		.string()
		.min(8, "パスワードは8文字以上である必要があります")
		.regex(/[A-Z]/, "大文字を1文字以上含める必要があります")
		.regex(/[a-z]/, "小文字を1文字以上含める必要があります")
		.regex(/[0-9]/, "数字を1文字以上含める必要があります")
		.regex(/[^A-Za-z0-9]/, "記号を1文字以上含める必要があります"),
});

interface PasswordRequirement {
	id: string;
	label: string;
	validator: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
	{
		id: "length",
		label: "8文字以上",
		validator: (password) => password.length >= 8,
	},
	{
		id: "uppercase",
		label: "大文字を1文字以上",
		validator: (password) => /[A-Z]/.test(password),
	},
	{
		id: "lowercase",
		label: "小文字を1文字以上",
		validator: (password) => /[a-z]/.test(password),
	},
	{
		id: "number",
		label: "数字を1文字以上",
		validator: (password) => /[0-9]/.test(password),
	},
	{
		id: "special",
		label: "記号を1文字以上",
		validator: (password) => /[^A-Za-z0-9]/.test(password),
	},
];

export default function SignUpPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [passwordError, setPasswordError] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const { signUp } = useAuth();

	const requirementStatus = useMemo(() => {
		return passwordRequirements.map((req) => ({
			...req,
			isMet: req.validator(password),
		}));
	}, [password]);

	const validatePassword = (value: string) => {
		try {
			passwordSchema.parse({ password: value });
			setPasswordError(null);
			return true;
		} catch (error) {
			if (error instanceof z.ZodError) {
				setPasswordError(error.errors[0].message);
			}
			return false;
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setPasswordError(null);
		setIsLoading(true);

		if (!validatePassword(password)) {
			setIsLoading(false);
			return;
		}

		try {
			await signUp(email, password, name);
			toast.success(
				<div className="space-y-2">
					<p className="font-medium">
						アカウントの作成が完了しました！
					</p>
					<p className="text-sm">
						メールアドレスに認証メールを送信しました。
						メール内のリンクをクリックして、アカウントの認証を完了してください。
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
			setPassword("");
			setName("");
		} catch (error) {
			console.error("Signup error:", error);
			setError(
				"アカウントの作成に失敗しました。入力内容を確認してください。"
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
						新規アカウント作成
					</h2>
				</div>
				<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
					<div className="rounded-md shadow-sm -space-y-px">
						<div>
							<label htmlFor="name" className="sr-only">
								お名前
							</label>
							<input
								id="name"
								name="name"
								type="text"
								required
								className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
								placeholder="お名前"
								value={name}
								onChange={(e) => setName(e.target.value)}
							/>
						</div>
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
								className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
								placeholder="メールアドレス"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</div>
						<div className="relative">
							<label htmlFor="password" className="sr-only">
								パスワード
							</label>
							<input
								id="password"
								name="password"
								type={showPassword ? "text" : "password"}
								autoComplete="new-password"
								required
								className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm pr-10"
								placeholder="パスワード"
								value={password}
								onChange={(e) => {
									setPassword(e.target.value);
									validatePassword(e.target.value);
								}}
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 focus:outline-none"
							>
								{showPassword ? (
									<EyeSlashIcon className="h-5 w-5" />
								) : (
									<EyeIcon className="h-5 w-5" />
								)}
							</button>
						</div>
					</div>

					<div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
						<h3 className="text-sm font-medium text-gray-900 mb-3">
							パスワードの要件
						</h3>
						<ul className="space-y-2">
							{requirementStatus.map((req) => (
								<li
									key={req.id}
									className="flex items-center space-x-2 text-sm"
								>
									{req.isMet ? (
										<CheckCircleIcon className="h-5 w-5 text-green-500" />
									) : (
										<XCircleIcon className="h-5 w-5 text-gray-300" />
									)}
									<span
										className={
											req.isMet
												? "text-gray-900"
												: "text-gray-500"
										}
									>
										{req.label}
									</span>
								</li>
							))}
						</ul>
					</div>

					{passwordError && (
						<div className="text-red-500 text-sm">
							{passwordError}
						</div>
					)}

					{error && (
						<div className="text-red-500 text-sm text-center">
							{error}
						</div>
					)}

					<div>
						<button
							type="submit"
							disabled={isLoading || !!passwordError}
							className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? "登録中..." : "アカウントを作成"}
						</button>
					</div>

					<div className="text-sm text-center">
						<Link
							href="/login"
							className="font-medium text-indigo-600 hover:text-indigo-500"
						>
							すでにアカウントをお持ちの方はこちら
						</Link>
					</div>
				</form>
			</div>
		</div>
	);
}
