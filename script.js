const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const submitButton = document.querySelector("#submit-button");
const todoList = document.querySelector("#todo-list");
const doneCount = document.querySelector("#done-count");
const progressCount = document.querySelector("#progress-count");

const API_URL = "http://127.0.0.1:5000/todos";

let todos = [];
let editingId = null;

fetchTodos();

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = input.value.trim();

  if (!text) {
    input.focus();
    return;
  }

  try {
    if (editingId) {
      await requestJson(`${API_URL}/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify({ text }),
      });
      clearEditingState();
    } else {
      await requestJson(API_URL, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
    }

    input.value = "";
    input.focus();
    await fetchTodos();
  } catch (error) {
    console.error(error);
    alert(error.message || "할 일을 저장하지 못했습니다.");
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
      await requestJson(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (editingId === id) {
        clearEditingState();
      }

      await fetchTodos();
    } catch (error) {
      console.error(error);
      alert(error.message || "할 일을 삭제하지 못했습니다.");
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
        await requestJson(`${API_URL}/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ done: !todo.done }),
        });
        await fetchTodos();
      } catch (error) {
        console.error(error);
        alert(error.message || "완료 상태를 저장하지 못했습니다.");
      }
    }
  }
});

async function fetchTodos() {
  try {
    const data = await requestJson(API_URL);

    todos = data
      .map(normalizeTodo)
      .sort((a, b) => b.createdAt - a.createdAt);

    renderTodos();
  } catch (error) {
    console.error(error);
    alert(error.message || "할 일 목록을 불러오지 못했습니다.");
  }
}

async function requestJson(url, options = {}) {
  const headers = { ...options.headers };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "서버 요청에 실패했습니다.");
  }

  return data;
}

function normalizeTodo(todo) {
  return {
    id: todo._id || todo.id,
    text: todo.text,
    done: Boolean(todo.done),
    createdAt: new Date(todo.createdAt || 0).getTime(),
  };
}

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
