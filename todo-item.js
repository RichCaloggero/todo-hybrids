import {parent, define, html, property} from "./hybrids/index.js";
import * as todoList from "./todo-list.js";

const TodoListItem = {
todoList: parent(todoList.TodoList),
index: 0,

edit: false,

editButton: todoList.ref("#edit"),
completeInput: todoList.ref("#complete-label input"),

complete: {
	connect: (host, key) => host[key] = false,
	observe: (host, value) => host.edit && host.completeInput.focus()
}, // complete

title: "",
body: {
get: (host, value) => host.textContent,
set: (host, value) => host.textContent = value
}, // body


render: ({ focus, edit, index, complete, title, body }) => {
console.debug("rendering item: ", index, title, body, complete);
return html`
<div class="item" role="document">
<div class="header">
<h3><button id="edit" aria-pressed="${edit? 'true' : 'false'}" onclick="${_edit}">
${title}
<span>(${complete? "completed" : "in progress"})</span>
</button></h3>
<button onclick="${_remove}" aria-label="remove ${title}">Remove</button>
</div>

${edit? renderForm() : html`<div class="body">${body}</div>`}
</div><!-- todo item -->
`;

function _edit (host) {
	host.edit = true;
//host.focus = "#complete-label input";
host.completeInput.focus();
} // _edit

function renderForm () {
return html`
<div role="dialog" aria-label="Edit">
<label id="complete-label">Complete: ${complete?
html`<input type="checkbox"  checked onchange="${html.set("complete")}">`
: html`<input type="checkbox"  onchange="${html.set("complete")}">`
}</label>

<label>Title: <input type="text" defaultValue="${title}" onchange="${html.set("title")}"></label>

<label>Body: <br><textarea onchange="${html.set("body")}">${body}</textarea></label>

<div class="actions">
<button onclick="${_save}">Save</button>
<button onclick="${_close}">Cancel</button>
</div>
</div>
`; // html
} // renderForm


function _close (host, event) {
	host.edit = false;
host.editButton.focus();
} // _close

function _save (host) {
todoList.update(host.index, {complete: host.complete, title: host.title, body: host.body}, host.todoList);
_close(host);
} // _save

function _remove (host) {
todoList.removeItem(host.index, host.todoList);
_close(host);
} // _remove

} // render

};

define("todo-item", TodoListItem);
