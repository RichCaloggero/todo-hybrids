import {define, html, render} from "./hybrids/index.js";

const todoItemTemplate = {
	complete: false,
	title: "[new item]",
	body: ""
};

const List = {
todoList: [],

render: ({todoList}) => {
console.debug("rendering todo list...");
return html`
<fieldset><legend><h2>Todo Items</h2></legend>
<div><button id="new" onclick="${_createItem}">New</button></div>
<hr><ul onupdate="${updateTodoList}" onremove="${removeTodoItem}">
${todoList.map((data, index) => {
const {complete, title, body} = {...data};
console.debug("render list: ", complete, title, body);
	return html`
<li><todo-item index="${index}" complete="${complete? 'complete' : ''}" title="${title}">
	${body}
	</todo-item></li>
`;
}) // map
}</ul>
</fieldset>
`;

function _createItem (host) {
//console.debug(host);
addTodoItem(todoItemTemplate, host);
host.render();
} // _createItem

} // render
};

define("todo-list", List);

export function addTodoItem (data, host) {
if (host.todoList.find(_data => _data.title === data.title)) return;
host.todoList = host.todoList.concat({...data});
} // addItem


function updateTodoList (host, event) {
const {complete, title, body} = {...event.target};
console.debug("updating ", complete, title, body);
host.todoList[event.target.index] = {complete, title, body};
} // updateTodoList

function removeTodoItem (host, event) {
console.debug("removing: ", host.tagName, event.target.tagName, event.target.index);
host.todoList = host.todoList.filter((x, i) => i !== event.target.index);
host.shadowRoot.querySelector("#new").focus();
} // deleteTodoItem
