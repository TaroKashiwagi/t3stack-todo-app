import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function HomePage() {
	const supabase = createServerComponentClient({ cookies });
	const {
		data: { session },
	} = await supabase.auth.getSession();

	return (
		<main className="container mx-auto px-4 py-16">
			<div className="max-w-2xl mx-auto text-center">
				<h1 className="text-4xl font-bold mb-6">
					Todoアプリへようこそ
				</h1>
				<p className="text-lg text-gray-600 mb-8">
					シンプルで使いやすいTodo管理アプリで、タスクを効率的に管理しましょう。
				</p>
				{session ? (
					<Link
						href="/todos"
						className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
					>
						Todoリストを見る
					</Link>
				) : (
					<div className="space-x-4">
						<Link
							href="/login"
							className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
						>
							ログイン
						</Link>
						<Link
							href="/signup"
							className="inline-block bg-gray-100 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
						>
							新規登録
						</Link>
					</div>
				)}
			</div>
		</main>
	);
}
