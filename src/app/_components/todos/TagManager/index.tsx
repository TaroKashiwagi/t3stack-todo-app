"use client";

import { useState } from "react";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Tag } from "@prisma/client";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";

export function TagManager() {
	const [isOpen, setIsOpen] = useState(false);
	const [editingTag, setEditingTag] = useState<Tag | null>(null);
	const [newTagName, setNewTagName] = useState("");
	const [newTagColor, setNewTagColor] = useState("#6B7280");
	const utils = trpc.useUtils();

	const { data: tags = [] } = trpc.tag.getAll.useQuery();

	const createTag = trpc.tag.create.useMutation({
		onSuccess: () => {
			utils.tag.getAll.invalidate();
			setNewTagName("");
			setNewTagColor("#6B7280");
			toast.success("タグを作成しました");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const updateTag = trpc.tag.update.useMutation({
		onSuccess: () => {
			utils.tag.getAll.invalidate();
			setEditingTag(null);
			toast.success("タグを更新しました");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const deleteTag = trpc.tag.delete.useMutation({
		onSuccess: () => {
			utils.tag.getAll.invalidate();
			toast.success("タグを削除しました");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleCreateTag = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newTagName.trim()) return;

		createTag.mutate({
			name: newTagName.trim(),
			color: newTagColor,
		});
	};

	const handleUpdateTag = (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingTag || !editingTag.name.trim()) return;

		updateTag.mutate({
			id: editingTag.id,
			name: editingTag.name.trim(),
			color: editingTag.color,
		});
	};

	const handleDeleteTag = (tagId: string) => {
		if (window.confirm("このタグを削除してもよろしいですか？")) {
			deleteTag.mutate({ id: tagId });
		}
	};

	return (
		<>
			<Button
				type="button"
				variant="outline"
				onClick={() => setIsOpen(true)}
				className="gap-2"
			>
				<Plus className="h-4 w-4" />
				<span>タグを管理</span>
			</Button>

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>タグの管理</DialogTitle>
					</DialogHeader>

					<div className="space-y-4">
						{/* タグ一覧 */}
						<div className="space-y-2">
							<h3 className="font-medium">タグ一覧</h3>
							<div className="flex flex-wrap gap-2">
								{tags.map((tag) => (
									<Badge
										key={tag.id}
										variant="secondary"
										style={{
											backgroundColor: tag.color,
											color: "#fff",
										}}
										className="flex items-center gap-2"
									>
										<span>{tag.name}</span>
										<Button
											variant="ghost"
											size="icon"
											className="h-4 w-4 p-0 hover:bg-white/20"
											onClick={() => setEditingTag(tag)}
										>
											<Pencil className="h-3 w-3" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="h-4 w-4 p-0 hover:bg-white/20"
											onClick={() =>
												handleDeleteTag(tag.id)
											}
										>
											<Trash2 className="h-3 w-3" />
										</Button>
									</Badge>
								))}
							</div>
						</div>

						{/* 新規タグ作成フォーム */}
						<form onSubmit={handleCreateTag} className="space-y-2">
							<h3 className="font-medium">新しいタグを作成</h3>
							<div className="flex gap-2">
								<Input
									value={newTagName}
									onChange={(e) =>
										setNewTagName(e.target.value)
									}
									placeholder="タグ名"
									required
								/>
								<Input
									type="color"
									value={newTagColor}
									onChange={(e) =>
										setNewTagColor(e.target.value)
									}
									className="w-12"
								/>
								<Button
									type="submit"
									disabled={
										!newTagName.trim() ||
										createTag.isPending
									}
								>
									作成
								</Button>
							</div>
						</form>
					</div>

					{/* タグ編集ダイアログ */}
					<Dialog
						open={!!editingTag}
						onOpenChange={() => setEditingTag(null)}
					>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>タグを編集</DialogTitle>
							</DialogHeader>
							<form
								onSubmit={handleUpdateTag}
								className="space-y-4"
							>
								<div className="space-y-2">
									<Input
										value={editingTag?.name ?? ""}
										onChange={(e) =>
											setEditingTag(
												(prev) =>
													prev && {
														...prev,
														name: e.target.value,
													}
											)
										}
										placeholder="タグ名"
										required
									/>
									<Input
										type="color"
										value={editingTag?.color ?? "#6B7280"}
										onChange={(e) =>
											setEditingTag(
												(prev) =>
													prev && {
														...prev,
														color: e.target.value,
													}
											)
										}
										className="w-full"
									/>
								</div>
								<DialogFooter>
									<Button
										type="button"
										variant="outline"
										onClick={() => setEditingTag(null)}
									>
										キャンセル
									</Button>
									<Button
										type="submit"
										disabled={
											!editingTag?.name.trim() ||
											updateTag.isPending
										}
									>
										更新
									</Button>
								</DialogFooter>
							</form>
						</DialogContent>
					</Dialog>
				</DialogContent>
			</Dialog>
		</>
	);
}
