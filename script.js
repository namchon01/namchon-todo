import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-analytics.js";
import {
  getDatabase,
  onValue,
  push,
  ref,
  remove,
  set,
  update,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDMEC38tesV0O1o08KRrhqrSUaNkE7srtM",
  authDomain: "namchon-todo.firebaseapp.com",
  projectId: "namchon-todo",
  databaseURL: "https://namchon-todo-default-rtdb.firebaseio.com/",
  storageBucket: "namchon-todo.firebasestorage.app",
  messagingSenderId: "246525719965",
  appId: "1:246525719965:web:9b43a75fc6ebd40b63ab74",
  measurementId: "G-HH1GXRQ6BQ",
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);
const database = getDatabase(app);
const todosRef = ref(database, "todos");

const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const submitButton = document.querySelector("#submit-button");
const todoList = document.querySelector("#todo-list");
const doneCount = document.querySelector("#done-count");
const progressCount = document.querySelector("#progress-count");

let todos = [];
let editingId = null;

onValue(
  todosRef,
  (snapshot) => {
    const data = snapshot.val() || {};

    todos = Object.entries(data)
      .map(([id, todo]) => ({
        id,
        text: todo.text,
        done: Boolean(todo.done),
        createdAt: todo.createdAt || 0,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);

    renderTodos();
  },
  (error) => {
    console.error(error);
    alert("Firebase에서 할 일 목록을 불러오지 못했습니다.");
  }
);

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = input.value.trim();

  if (!text) {
    input.focus();
    return;
  }

  try {
    if (editingId) {
      await update(ref(database, `todos/${editingId}`), { text });
      editingId = null;
      submitButton.textContent = "Save";
    } else {
      const newTodoRef = push(todosRef);

      await set(newTodoRef, {
        text,
        done: false,
        createdAt: Date.now(),
      });
    }

    input.value = "";
    input.focus();
  } catch (error) {
    console.error(error);
    alert("Firebase에 할 일을 저장하지 못했습니다.");
  }
});

todoList.addEventListener("click", async (event) => {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  const item = button.closest(".todo-item");
  const id = item.dataset.id;

  if (button.classList.contains("delete-button")) {
    try {
      await remove(ref(database, `todos/${id}`));

      if (editingId === id) {
        clearEditingState();
      }
    } catch (error) {
      console.error(error);
      alert("Firebase에서 할 일을 삭제하지 못했습니다.");
    }
  }

  if (button.classList.contains("edit-button")) {
    const todo = todos.find((itemTodo) => itemTodo.id === id);

    if (todo) {
      editingId = id;
      input.value = todo.text;
      submitButton.textContent = "Update";
      input.focus();
    }
  }

  if (button.classList.contains("done-button")) {
    const todo = todos.find((itemTodo) => itemTodo.id === id);

    if (todo) {
      try {
        await update(ref(database, `todos/${id}`), { done: !todo.done });
      } catch (error) {
        console.error(error);
        alert("Firebase에 완료 상태를 저장하지 못했습니다.");
      }
    }
  }
});

function renderTodos() {
  todoList.innerHTML = "";

  if (todos.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = "아직 등록된 할 일이 없습니다.";
    todoList.appendChild(emptyMessage);
  }

  todos.forEach((todo) => {
    const item = document.createElement("li");
    item.className = `todo-item${todo.done ? " done" : ""}`;
    item.dataset.id = todo.id;

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;

    const actions = document.createElement("div");
    actions.className = "todo-actions";
    actions.append(
      createIconButton("delete-button", "삭제", trashIcon()),
      createIconButton("edit-button", "수정", editIcon()),
      createIconButton("done-button", todo.done ? "진행 중으로 변경" : "완료", checkIcon())
    );

    item.append(text, actions);
    todoList.appendChild(item);
  });

  updateCounts();
}

function updateCounts() {
  const completedCount = todos.filter((todo) => todo.done).length;

  doneCount.textContent = completedCount;
  progressCount.textContent = todos.length - completedCount;
}

function createIconButton(className, label, icon) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `icon-button ${className}`;
  button.setAttribute("aria-label", label);
  button.innerHTML = icon;

  return button;
}

function clearEditingState() {
  editingId = null;
  input.value = "";
  submitButton.textContent = "Save";
}

function trashIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 15h10l1-15" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  `;
}

function editIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20h4l11-11-4-4L4 16v4z" />
      <path d="M13 6l4 4" />
    </svg>
  `;
}

function checkIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l3 3 5-6" />
    </svg>
  `;
}
