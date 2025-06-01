"use client";

import { useState } from "react";
import { type Todo, type Tag } from "@/app/_types/todo";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Tag as TagIcon, Plus, Flag } from "lucide-react";
import {
	format,
	setHours,
	setMinutes,
	setSeconds,
	setMilliseconds,
} from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/app/_lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface TodoEditModalProps {
	todo: Todo;
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
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

export function TodoEditModal({
	todo,
	isOpen,
	onClose,
	onSuccess,
}: TodoEditModalProps) {
	const [title, setTitle] = useState(todo.title);
	const [description, setDescription] = useState(todo.description || "");
	const [dueDate, setDueDate] = useState<Date | undefined>(
		todo.dueDate ? new Date(todo.dueDate) : undefined
	);
	const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">(
		todo.priority || "MEDIUM"
	);
	const [category, setCategory] = useState(todo.category || "");
	const [selectedTags, setSelectedTags] = useState<Tag[]>(todo.tags || []);
	const [isCreatingTag, setIsCreatingTag] = useState(false);
	const [newTagName, setNewTagName] = useState("");
	const [newTagColor, setNewTagColor] = useState("#6B7280");

	const utils = trpc.useUtils();

	const createTag = trpc.tag.create.useMutation({
		onSuccess: () => {
			utils.tag.getAll.invalidate();
			setNewTagName("");
			setNewTagColor("#6B7280");
			setIsCreatingTag(false);
			toast.success("タグを作成しました");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const updateTodo = trpc.todo.update.useMutation({
		onSuccess: () => {
			utils.todo.getAll.invalidate();
			onSuccess();
			onClose();
			toast.success("タスクを更新しました");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim()) return;

		let adjustedDueDate = dueDate;
		if (dueDate) {
			adjustedDueDate = setHours(
				setMinutes(setSeconds(setMilliseconds(dueDate, 0), 0), 0),
				12
			);
		}

		updateTodo.mutate({
			id: todo.id,
			title: title.trim(),
			description: description.trim() || undefined,
			dueDate: adjustedDueDate,
			priority,
			category: category || undefined,
			tagIds: selectedTags.map((tag) => tag.id),
		});
	};

	const handleCreateTag = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newTagName.trim()) return;

		createTag.mutate({
			name: newTagName.trim(),
			color: newTagColor,
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
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>タスクを編集</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<label
							htmlFor="title"
							className="text-sm font-medium leading-none"
						>
							タイトル
						</label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="タスクのタイトル"
							required
						/>
					</div>

					<div className="space-y-2">
						<label
							htmlFor="description"
							className="text-sm font-medium leading-none"
						>
							説明
						</label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="タスクの説明"
							className="min-h-[100px]"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium leading-none">
							期限
						</label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className={cn(
										"w-full justify-start text-left font-normal",
										!dueDate && "text-muted-foreground"
									)}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{dueDate ? (
										format(dueDate, "PPP", { locale: ja })
									) : (
										<span>期限を選択</span>
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
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium leading-none">
							優先度
						</label>
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
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium leading-none">
							カテゴリ
						</label>
						<Input
							value={category}
							onChange={(e) => setCategory(e.target.value)}
							placeholder="カテゴリ"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium leading-none">
							タグ
						</label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className="w-full justify-start"
								>
									<TagIcon className="mr-2 h-4 w-4" />
									<span>
										{selectedTags.length > 0
											? `${selectedTags.length}個のタグを選択中`
											: "タグを選択"}
									</span>
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-80">
								<div className="space-y-4">
									<div className="space-y-2">
										<h4 className="font-medium">
											タグを選択
										</h4>
										<div className="flex flex-wrap gap-2">
											{selectedTags.map((tag) => (
												<Badge
													key={tag.id}
													variant="secondary"
													className={cn(
														"cursor-pointer",
														selectedTags.some(
															(t) =>
																t.id === tag.id
														) &&
															"bg-primary text-primary-foreground"
													)}
													style={{
														backgroundColor:
															selectedTags.some(
																(t) =>
																	t.id ===
																	tag.id
															)
																? undefined
																: tag.color,
														color: selectedTags.some(
															(t) =>
																t.id === tag.id
														)
															? undefined
															: "#fff",
													}}
													onClick={() =>
														toggleTag(tag)
													}
												>
													{tag.name}
												</Badge>
											))}
										</div>
									</div>

									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<h4 className="font-medium">
												新しいタグ
											</h4>
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													setIsCreatingTag(
														!isCreatingTag
													)
												}
											>
												<Plus className="h-4 w-4" />
											</Button>
										</div>
										{isCreatingTag && (
											<form
												onSubmit={handleCreateTag}
												className="space-y-2"
											>
												<Input
													value={newTagName}
													onChange={(e) =>
														setNewTagName(
															e.target.value
														)
													}
													placeholder="タグ名"
													required
												/>
												<div className="flex items-center gap-2">
													<input
														type="color"
														value={newTagColor}
														onChange={(e) =>
															setNewTagColor(
																e.target.value
															)
														}
														className="h-8 w-8 rounded cursor-pointer"
													/>
													<Button
														type="submit"
														size="sm"
														disabled={
															!newTagName.trim() ||
															createTag.isPending
														}
													>
														作成
													</Button>
												</div>
											</form>
										)}
									</div>
								</div>
							</PopoverContent>
						</Popover>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
						>
							キャンセル
						</Button>
						<Button
							type="submit"
							disabled={!title.trim() || updateTodo.isPending}
						>
							更新
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
