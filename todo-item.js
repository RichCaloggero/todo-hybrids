import {parent, define, html, property} from "./hybrids/index.js";

export const TodoItem = {
	complete: false,
	title: "",
	body: {
		get: (host, value) => host.textContent,
		set: (host, value) => host.textContent = value
	}, // body
}; // descriptors
define("todo-item", TodoItem);
