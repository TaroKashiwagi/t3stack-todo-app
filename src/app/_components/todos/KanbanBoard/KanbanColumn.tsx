"use client";
import { useDroppable } from "@dnd-kit/core";
import { TodoItem } from "@/app/_components/todos/TodoItem";
import { type Todo, type TodoStatus } from "@/app/_types/todo";
import { type Tag } from "@prisma/client";

interface KanbanColumnProps {
	status: TodoStatus;
	todos: Todo[];
	tags: Tag[];
}

const STATUS_LABELS: Record<TodoStatus, string> = {
	TODO: "未着手",
	IN_PROGRESS: "進行中",
	DONE: "完了",
};

export function KanbanColumn({ status, todos }: KanbanColumnProps) {
	const { setNodeRef } = useDroppable({
		id: status,
	});

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-lg font-semibold">
					{STATUS_LABELS[status]}
				</h2>
				<span className="text-sm text-gray-500">{todos.length}</span>
			</div>
			<div
				ref={setNodeRef}
				className="flex-1 p-4 bg-gray-50 rounded-lg min-h-[200px]"
			>
				<div className="space-y-2">
					{todos.map((todo) => (
						<TodoItem key={todo.id} todo={todo} />
					))}
				</div>
			</div>
		</div>
	);
}
