import {children, define, html, render} from "./hybrids/index.js";
import {TodoItem} from "./todo-item.js";

const todoItemTemplate = {
complete: false,
title: "[new item]",
body: ""
};

const TodoList = {
_children: children(TodoItem),

todoList: {
connect: (host, key) => host[key] = host._children.map(getItemProperties),
}, // todoList

edit: false,
	
complete: {
	connect: (host, key) => host[key] = false,
	observe: (host, value) => host.edit && host.completeInput.focus()
}, // complete

editButton: ref("#edit"),
newButton: ref("#new"),
completeInput: ref("#complete-label input"),

render: ({ todoList, edit }) => {
return html`
<fieldset><legend><h2>Todo Items</h2></legend>
<div role="status" aria-atomic="true" id="status">${todoList.length} items.</div>
<div><button id="new" onclick="${_createItem}">New</button></div>
<hr><ul style="list-style-type: none;">
${todoList.map(renderTodoItem)}
</ul></fieldset>
`;

function _createItem (host) {
//console.debug(host);
addItem(host, todoItemTemplate);
} // _createItem

function renderTodoItem ({complete, title, body}, index) {
return html`<li><div class="item" role="document">
<div class="header">
<h3><button id="edit" aria-pressed="${edit? 'true' : 'false'}" onclick="${_edit}">
${title}
<span>(${complete? "completed" : "in progress"})</span>
</button></h3>
<button onclick="${_remove}" aria-label="remove ${title}">Remove</button>
</div>

${edit? renderForm({index, complete, title, body}) : html`<div class="body">${body}</div>`}
</div></li>
`;

function _edit (host) {
	host.edit = true;
host.completeInput.focus();
console.debug("edit mode: ", host.edit);
} // _edit

function _remove (host) {
removeItem(index, host);
_close(host);
} // _remove
} // renderTodoItem

function renderForm ({index, complete, title, body}) {
const data = {complete, title, body};
console.debug("renderForm: ", index, complete, title, body);
return html`
<div role="dialog" aria-label="Edit" onkeydown="${_handleShortcutKey}">
<label id="complete-label">Complete:
${complete?
html`<input type="checkbox" checked onchange="${(host, event) => _set("complete", false)}">`
: html`<input type="checkbox" onchange="${(host, event) => _set("complete", true)}">`
}
</label>

<label>Title: <input type="text" defaultValue="${title}" onchange="${(host, event) => _set("title", event.target.value)}"></label>

<label>Body: <br><textarea onchange="${(host, event) => _set("body", event.target.value)}">${body}</textarea></label>

<div class="actions">
<button onclick="${_save}">Save</button>
<button onclick="${_close}">Cancel</button>
</div>
</div>
`; // html

function _handleShortcutKey (host, event) {
	if (event.key === "Escape") {
		event.preventDefault();
_close(host);
	/*} else if (event.altKey && event.shiftKey && event.key === "s") {
				event.preventDefault();
_save(host);
	*/
	} // if
	} // _handleShortcutKey

function _set (prop, value) {
	data[prop] = value;
console.debug(`setting ${prop} to ${value}`, data);
} // _set

function _close (host, event) {
	host.edit = false;
host.editButton.focus();
} // _close

function _save (host) {
console.debug("save: ", index, complete, title, body);
update(index, {...data}, host);
_close(host);
} // _save
} // renderForm

}, // render
}; // descriptors

define("todo-list", TodoList);

export function addItem (host, data) {
if (host.todoList.find(_data => _data.title === data.title)) return;
host.todoList = [{...data}].concat(host.todoList);
} // addItem


export function update (index, data, host) {
console.debug("updating ", data);
host.todoList = [].concat(
data,
host.todoList.filter((x, i) => i !== index)
); // concat
} // update

export function removeItem  (index, host) {
host.todoList = host.todoList.filter((x, i) => i !== index);
host.newButton.focus();
} // removeItem

export function ref(query) {
return ({ render }) => {
if (typeof render === 'function') {
const target = render();
return target.querySelector(query);
} // if

return null;
}; // return function
} // ref

function getItemProperties (item) {
const props =  Object.fromEntries(
Object.keys(todoItemTemplate).map(key => [key, item[key]])
); // fromEntries
console.debug("item properties: ", props);
return props;
} // getItemProperties
