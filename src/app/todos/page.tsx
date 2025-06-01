"use client";

import { TodoForm } from "@/app/_components/todos/TodoForm";
import { KanbanBoard } from "@/app/_components/todos/KanbanBoard";
import { trpc } from "@/app/_trpc/client";

export default function TodosPage() {
	const { data: todos = [], refetch } = trpc.todo.getAll.useQuery();

	return (
		<main className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-2xl font-bold mb-4">カンバンボード</h1>
				<TodoForm onSuccess={() => refetch()} onCancel={() => {}} />
			</div>
			<KanbanBoard todos={todos} onUpdate={() => refetch()} />
		</main>
	);
}
