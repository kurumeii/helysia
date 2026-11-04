import type { Todo } from "@db";
import { todoPath } from "@/shared/routes.ts";

export const TodoRow = ({ todo }: { todo: Todo }) => (
	<li
		id={`todo-${todo.id}`}
		class="list-row items-center"
		hx-target="this"
		hx-swap="outerHTML"
	>
		<input
			type="checkbox"
			class="checkbox"
			aria-label="Done"
			checked={todo.done}
			hx-patch={todoPath(todo.id, "toggle")}
		/>
		<span class={todo.done ? "line-through opacity-60" : ""} safe>
			{todo.title}
		</span>
		<div class="flex gap-1">
			<button
				type="button"
				class="btn btn-ghost btn-sm"
				hx-get={todoPath(todo.id, "edit")}
			>
				Edit
			</button>
			<button
				type="button"
				class="btn btn-ghost btn-sm text-error"
				hx-delete={todoPath(todo.id)}
			>
				Delete
			</button>
		</div>
	</li>
);

export const TodoEditRow = ({ todo }: { todo: Todo }) => (
	<li
		id={`todo-${todo.id}`}
		class="list-row items-center"
		hx-target="this"
		hx-swap="outerHTML"
	>
		<form class="flex w-full gap-2" hx-put={todoPath(todo.id)}>
			<input
				name="title"
				value={todo.title}
				class="input input-sm flex-1"
				required
				maxlength="200"
				aria-label="Title"
				autofocus
			/>
			<button type="submit" class="btn btn-primary btn-sm">
				Save
			</button>
			<button type="button" class="btn btn-sm" hx-get={todoPath(todo.id)}>
				Cancel
			</button>
		</form>
	</li>
);
