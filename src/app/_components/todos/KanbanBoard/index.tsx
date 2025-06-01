"use client";

import { useState, useEffect } from "react";
import {
	DndContext,
	DragEndEvent,
	DragOverlay,
	DragStartEvent,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
	DragOverEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "./KanbanColumn";
import { TodoItem } from "@/app/_components/todos/TodoItem";
import { type Todo, type TodoStatus } from "@/app/_types/todo";
import { trpc } from "@/app/_trpc/client";
import { toast } from "sonner";

const COLUMNS: TodoStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

interface KanbanBoardProps {
	todos: Todo[];
	onUpdate: () => void;
}

export function KanbanBoard({
	todos: initialTodos,
	onUpdate,
}: KanbanBoardProps) {
	const [activeId, setActiveId] = useState<string | null>(null);
	const [todos, setTodos] = useState<Todo[]>(initialTodos);
	const utils = trpc.useUtils();

	// タグの取得
	const { data: tags = [] } = trpc.tag.getAll.useQuery();

	useEffect(() => {
		setTodos(initialTodos);
	}, [initialTodos]);

	const sensors = useSensors(
		useSensor(MouseSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
		useSensor(TouchSensor, {
			activationConstraint: {
				delay: 100,
				tolerance: 5,
			},
		})
	);

	const updateTodo = trpc.todo.update.useMutation({
		onMutate: async (newTodo) => {
			await utils.todo.getAll.cancel();
			const previousTodos = utils.todo.getAll.getData();

			utils.todo.getAll.setData(undefined, (old) => {
				if (!old) return [];
				return old.map((todo) =>
					todo.id === newTodo.id
						? {
								...todo,
								status: newTodo.status ?? todo.status,
								order: newTodo.order ?? todo.order,
						  }
						: todo
				);
			});

			return { previousTodos };
		},
		onError: (err, newTodo, context) => {
			utils.todo.getAll.setData(undefined, context?.previousTodos);
			toast.error(err.message);
		},
		onSettled: () => {
			utils.todo.getAll.invalidate();
			onUpdate();
		},
	});

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(event.active.id as string);
	};

	const handleDragOver = (event: DragOverEvent) => {
		const { active, over } = event;
		if (!over) return;

		const activeTodo = todos.find((todo) => todo.id === active.id);
		if (!activeTodo) return;

		// ステータス列にドラッグオーバーされた場合
		if (COLUMNS.includes(over.id as TodoStatus)) {
			const newStatus = over.id as TodoStatus;
			if (activeTodo.status !== newStatus) {
				const lastTodoInStatus = todos
					.filter((todo) => todo.status === newStatus)
					.sort((a, b) => b.order - a.order)[0];

				setTodos((currentTodos) =>
					currentTodos.map((todo) =>
						todo.id === activeTodo.id
							? {
									...todo,
									status: newStatus,
									order: lastTodoInStatus
										? lastTodoInStatus.order + 1
										: 0,
							  }
							: todo
					)
				);
			}
		}
		// 別のタスクの上にドラッグオーバーされた場合
		else {
			const overTodo = todos.find((todo) => todo.id === over.id);
			if (overTodo && activeTodo.status !== overTodo.status) {
				setTodos((currentTodos) =>
					currentTodos.map((todo) =>
						todo.id === activeTodo.id
							? {
									...todo,
									status: overTodo.status,
									order: overTodo.order,
							  }
							: todo
					)
				);
			}
		}
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (!over) {
			setActiveId(null);
			return;
		}

		const activeTodo = todos.find((todo) => todo.id === active.id);
		if (!activeTodo) {
			setActiveId(null);
			return;
		}

		// ステータス列にドロップされた場合
		if (COLUMNS.includes(over.id as TodoStatus)) {
			const newStatus = over.id as TodoStatus;
			const lastTodoInStatus = todos
				.filter((todo) => todo.status === newStatus)
				.sort((a, b) => b.order - a.order)[0];

			updateTodo.mutate({
				id: activeTodo.id,
				status: newStatus,
				order: lastTodoInStatus ? lastTodoInStatus.order + 1 : 0,
			});
		}
		// 別のタスクの上にドロップされた場合
		else {
			const overTodo = todos.find((todo) => todo.id === over.id);
			if (overTodo) {
				updateTodo.mutate({
					id: activeTodo.id,
					status: overTodo.status,
					order: overTodo.order,
				});
			}
		}

		setActiveId(null);
	};

	const getTodosByStatus = (status: TodoStatus) => {
		return todos
			.filter((todo) => todo.status === status)
			.sort((a, b) => a.order - b.order);
	};

	return (
		<DndContext
			sensors={sensors}
			onDragStart={handleDragStart}
			onDragOver={handleDragOver}
			onDragEnd={handleDragEnd}
		>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{COLUMNS.map((status) => (
					<KanbanColumn
						key={status}
						status={status}
						todos={getTodosByStatus(status)}
						tags={tags}
					/>
				))}
			</div>

			<DragOverlay>
				{activeId ? (
					<TodoItem
						todo={todos.find((todo) => todo.id === activeId)!}
						isDragging={true}
					/>
				) : null}
			</DragOverlay>
		</DndContext>
	);
}
