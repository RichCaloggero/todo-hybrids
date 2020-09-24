import {define, html, render} from "./hybrids/index.js";

const todoItemTemplate = {
complete: false,
title: "[new item]",
body: ""
};

export const TodoList = {
todoList: [],
count: 0,
newButton: ref("#new"),


render: ({ todoList}) => {
console.debug("rendering todo list...");
return html`
<fieldset><legend><h2>Todo Items</h2></legend>
<div role="status" aria-atomic="true" id="status">${todoList.length} items.</div>
<div><button id="new" onclick="${_createItem}">New</button></div>
<hr><ul>
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
addItem(host, todoItemTemplate);
} // _createItem

} // render
};

define("todo-list", TodoList);

export function addItem (host, data) {
if (host.todoList.find(_data => _data.title === data.title)) return;
host.todoList = host.todoList.concat({...data});
} // addItem


export function update (index, data, parent) {
console.debug("updating ", data);
parent.todoList = [].concat(
data,
parent.todoList.filter((x, i) => i !== index)
); // concat
} // update

export function removeItem  (index, parent) {
console.debug("removing: ", parent.tagName, index);
parent.todoList = parent.todoList.filter((x, i) => i !== index);
parent.newButton.focus();
} // removeItem

export function ref(query) {
return ({ render }) => {
if (typeof render === 'function') {
const target = render();
return target.querySelector(query);
} // if

return null;
}; // return
} // ref
