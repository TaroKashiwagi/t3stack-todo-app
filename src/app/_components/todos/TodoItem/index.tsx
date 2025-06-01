"use client";

import { useState } from "react";
import { type Todo } from "@/app/_types/todo";
import { Button } from "@/components/ui/button";
import { trpc } from "@/app/_trpc/client";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Calendar, Tag as TagIcon, Pencil, Flag } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { TodoEditModal } from "@/app/_components/todos/TodoEditModal";
import { cn } from "@/app/_lib/utils";

interface TodoItemProps {
	todo: Todo;
	onDelete?: (id: string) => void;
	isDragging?: boolean;
}

const priorityLabels = {
	LOW: "低",
	MEDIUM: "中",
	HIGH: "高",
} as const;

const priorityColors = {
	LOW: "text-blue-500",
	MEDIUM: "text-yellow-500",
	HIGH: "text-red-500",
} as const;

export function TodoItem({ todo, onDelete, isDragging }: TodoItemProps) {
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const utils = trpc.useUtils();

	const deleteTodo = trpc.todo.delete.useMutation({
		onSuccess: () => {
			utils.todo.getAll.invalidate();
			if (onDelete) onDelete(todo.id);
		},
	});

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging: isSortableDragging,
	} = useSortable({
		id: todo.id,
		data: {
			type: "todo",
			todo,
		},
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging || isSortableDragging ? 0.5 : 1,
		zIndex: isDragging || isSortableDragging ? 1 : 0,
	};

	const handleDelete = () => {
		if (window.confirm("このタスクを削除してもよろしいですか？")) {
			deleteTodo.mutate({ id: todo.id });
		}
	};

	return (
		<>
			<Card
				ref={setNodeRef}
				style={style}
				{...attributes}
				{...listeners}
				className={`mb-2 cursor-grab active:cursor-grabbing ${
					isDragging || isSortableDragging ? "shadow-lg" : ""
				}`}
			>
				<CardContent className="p-4">
					<div className="flex items-center justify-between mb-2">
						<div className="flex items-center space-x-3">
							<h3 className="font-medium">{todo.title}</h3>
							<div className="flex items-center gap-1">
								<Flag
									className={cn(
										"h-4 w-4",
										priorityColors[
											todo.priority || "MEDIUM"
										]
									)}
								/>
								<span className="text-sm text-muted-foreground">
									{priorityLabels[todo.priority || "MEDIUM"]}
								</span>
							</div>
						</div>
						<div className="flex items-center space-x-2">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsEditModalOpen(true)}
								className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
							>
								<Pencil className="h-5 w-5" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onClick={handleDelete}
								className="text-red-500 hover:text-red-700 hover:bg-red-50"
							>
								<Trash2 className="h-5 w-5" />
							</Button>
						</div>
					</div>

					{todo.description && (
						<p className="text-sm text-gray-500 mb-2">
							{todo.description}
						</p>
					)}

					<div className="flex flex-wrap gap-2 items-center text-sm text-gray-500">
						{todo.dueDate && (
							<div className="flex items-center space-x-1">
								<Calendar className="h-4 w-4" />
								<span>
									{format(new Date(todo.dueDate), "M月d日", {
										locale: ja,
									})}
								</span>
							</div>
						)}

						{todo.tags && todo.tags.length > 0 && (
							<div className="flex items-center space-x-1">
								<TagIcon className="h-4 w-4" />
								<div className="flex flex-wrap gap-1">
									{todo.tags.map((tag) => (
										<Badge
											key={tag.id}
											variant="secondary"
											style={{
												backgroundColor: tag.color,
												color: "#fff",
											}}
										>
											{tag.name}
										</Badge>
									))}
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<TodoEditModal
				todo={todo}
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				onSuccess={() => {
					utils.todo.getAll.invalidate();
					setIsEditModalOpen(false);
				}}
			/>
		</>
	);
}
