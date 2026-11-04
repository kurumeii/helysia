export const ROUTES = {
	home: "/",
	login: "/login",
	register: "/register",
	logout: "/logout",
	todos: "/todos",
} as const;

export const todoPath = (id: number, action?: "edit" | "toggle") =>
	action ? `${ROUTES.todos}/${id}/${action}` : `${ROUTES.todos}/${id}`;

export const HX = {
	request: "hx-request",
	redirect: "hx-redirect",
} as const;
