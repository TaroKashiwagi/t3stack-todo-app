export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type TodoStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface Tag {
	id: string;
	name: string;
	color: string;
}

export interface Todo {
	id: string;
	title: string;
	description?: string | null;
	completed: boolean;
	dueDate?: Date | null;
	priority: "LOW" | "MEDIUM" | "HIGH";
	category?: string | null;
	position: number;
	createdAt: Date;
	updatedAt: Date;
	tags: Tag[];
	order: number;
	status: TodoStatus;
}

export interface CreateTodoInput {
	title: string;
	description: string;
	status?: TodoStatus;
}

export interface UpdateTodoInput {
	id: string;
	title?: string;
	description?: string;
	completed?: boolean;
	status?: TodoStatus;
	order?: number;
}

export interface TodoFilters {
	search?: string;
	completed?: boolean;
	status?: TodoStatus;
}
