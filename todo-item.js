import {define, html, property} from "./hybrids/index.js";
import * as todoList from "./todo-list.js";

const Item = {
index: 0,

edit: {
connect: (host, key) => host[key] = false,
observe: (host, value) => {
if (value) {
setTimeout(() => host.shadowRoot.querySelector("#complete-label input").focus(), 0);
} else {
	host.shadowRoot.querySelector("#edit").focus();
} // if
} // observe
}, // edit

complete: {
	connect: (host, key) => host[key] = false,
	observe: (host, value) => host.edit && setTimeout(() => host.shadowRoot.querySelector("#complete-label input").focus(), 0)
}, // complete

title: "",
body: {
get: (host, value) => host.textContent,
set: (host, value) => host.textContent = value
}, // body


render: ({ edit, index, complete, title, body }) => {
return html`
<div class="item" role="document">
<div class="header">
<h3><button id="edit" aria-pressed="${edit? 'true' : 'false'}" onclick="${(host, event) => host.edit = true}">
${title}
<span>(${complete? "completed" : "in progress"})</span>
</button></h3>
<button onclick="${_remove}" aria-label="remove ${title}">Remove</button>
</div>

${edit? renderForm() : html`<div class="body">${body}</div>`}
</div><!-- todo item -->
`;

function renderForm () {
return html`
<div role="dialog" aria-label="Edit">
<label id="complete-label">Complete: ${complete?
html`<input type="checkbox"  checked onchange="${html.set("complete")}">`
: html`<input type="checkbox"  onchange="${html.set("complete")}">`
}</label>
<label>Title: <input type="text" defaultValue="${title}" oninput="${html.set("title")}"></label>
<label>Body: <br><textarea oninput="${html.set("body")}">${body}</textarea></label>

<div class="actions">
<button onclick="${_save}">Save</button>
<button onclick="${_close}">Cancel</button>
</div>
</div>
`; // html
} // renderForm


function _close (host, event) {
	host.edit = false;
} // _close

function _save (host) {
host.dispatchEvent(new CustomEvent("update", {bubbles: true}));
_close(host);
} // _save

function _remove (host) {
host.dispatchEvent(new CustomEvent("remove", {bubbles: true}));
_close(host);
} // _remove

} // render

};

define("todo-item", Item);
