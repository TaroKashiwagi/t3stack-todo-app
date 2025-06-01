"use client";

import { useState } from "react";
import { useAuth } from "@/app/_lib/auth";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Tag as TagIcon, Flag } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/app/_lib/utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tag } from "@prisma/client";
import { TagManager } from "@/app/_components/todos/TagManager";

interface TodoFormProps {
	onSuccess: () => void;
	onCancel: () => void;
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

export function TodoForm({ onSuccess, onCancel }: TodoFormProps) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
	const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">(
		"MEDIUM"
	);
	const [category, setCategory] = useState("");
	const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
	const { user } = useAuth();
	const utils = trpc.useUtils();

	const createTodo = trpc.todo.create.useMutation({
		onSuccess: () => {
			setTitle("");
			setDescription("");
			setDueDate(undefined);
			setPriority("MEDIUM");
			setCategory("");
			setSelectedTags([]);
			utils.todo.getAll.invalidate();
			onSuccess();
			toast.success("タスクを作成しました");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim()) return;

		if (!user) {
			toast.error("ログインが必要です");
			return;
		}

		createTodo.mutate({
			title: title.trim(),
			description: description.trim() || undefined,
			dueDate,
			priority,
			category: category || undefined,
			tagIds: selectedTags.map((tag) => tag.id),
		});
	};

	const toggleTag = (tag: Tag) => {
		setSelectedTags((prev) =>
			prev.some((t) => t.id === tag.id)
				? prev.filter((t) => t.id !== tag.id)
				: [...prev, tag]
		);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Input
					type="text"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="タスクのタイトル"
					required
				/>
				<Textarea
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="タスクの説明（任意）"
					className="resize-none"
				/>
			</div>

			<div className="flex flex-wrap gap-2">
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className={cn(
								"justify-start text-left font-normal",
								!dueDate && "text-muted-foreground"
							)}
						>
							<CalendarIcon className="mr-2 h-4 w-4" />
							{dueDate ? (
								format(dueDate, "PPP", { locale: ja })
							) : (
								<span>期限を設定</span>
							)}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0">
						<Calendar
							mode="single"
							selected={dueDate}
							onSelect={setDueDate}
							initialFocus
						/>
					</PopoverContent>
				</Popover>

				<Select
					value={priority}
					onValueChange={(value: "LOW" | "MEDIUM" | "HIGH") =>
						setPriority(value)
					}
				>
					<SelectTrigger className="w-[120px]">
						<SelectValue>
							<div className="flex items-center gap-2">
								<Flag
									className={cn(
										"h-4 w-4",
										priorityColors[priority]
									)}
								/>
								<span>{priorityLabels[priority]}</span>
							</div>
						</SelectValue>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="LOW">
							<div className="flex items-center gap-2">
								<Flag className="h-4 w-4 text-blue-500" />
								<span>低</span>
							</div>
						</SelectItem>
						<SelectItem value="MEDIUM">
							<div className="flex items-center gap-2">
								<Flag className="h-4 w-4 text-yellow-500" />
								<span>中</span>
							</div>
						</SelectItem>
						<SelectItem value="HIGH">
							<div className="flex items-center gap-2">
								<Flag className="h-4 w-4 text-red-500" />
								<span>高</span>
							</div>
						</SelectItem>
					</SelectContent>
				</Select>

				<Popover>
					<PopoverTrigger asChild>
						<Button variant="outline" className="gap-2">
							<TagIcon className="h-4 w-4" />
							<span>タグを選択</span>
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-80">
						<div className="space-y-2">
							<h4 className="font-medium">タグを選択</h4>
							<div className="flex flex-wrap gap-2">
								{selectedTags.map((tag) => (
									<Badge
										key={tag.id}
										variant="secondary"
										className={cn(
											"cursor-pointer",
											selectedTags.some(
												(t) => t.id === tag.id
											) &&
												"bg-primary text-primary-foreground"
										)}
										style={{
											backgroundColor: selectedTags.some(
												(t) => t.id === tag.id
											)
												? undefined
												: tag.color,
											color: selectedTags.some(
												(t) => t.id === tag.id
											)
												? undefined
												: "#fff",
										}}
										onClick={() => toggleTag(tag)}
									>
										{tag.name}
									</Badge>
								))}
							</div>
						</div>
					</PopoverContent>
				</Popover>

				<div className="flex items-center">
					<TagManager />
				</div>
			</div>

			<div className="flex justify-end gap-2">
				<Button type="button" variant="outline" onClick={onCancel}>
					キャンセル
				</Button>
				<Button
					type="submit"
					variant="default"
					loading={createTodo.isPending}
					disabled={!title.trim()}
				>
					作成
				</Button>
			</div>
		</form>
	);
}
