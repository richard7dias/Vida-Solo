(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Chaves de armazenamento
  const STORAGE_KEYS = {
    TODOS: "vidasolo.todos",
    SERVICES: "vidasolo.services",
  };

  /* ---------- Navegação por abas ---------- */
  const views = {
    home: $("#home"),
    todo: $("#todo"),
    services: $("#services"),
  };

  const tabButtons = $$(".tab-button");

  function showView(targetId) {
    Object.entries(views).forEach(([id, el]) => {
      const isTarget = id === targetId;
      el.hidden = !isTarget;
      el.classList.toggle("is-visible", isTarget);
    });

    tabButtons.forEach((btn) => {
      const active = btn.dataset.target === targetId;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.target));
  });

  // Exibir a seção inicial
  showView("home");

  // Ano do rodapé
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Util: localStorage ---------- */
  const storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },
  };

  /* =========================================================
     ToDo
     ========================================================= */
  const todoForm = $("#todo-form");
  const todoInput = $("#todo-input");
  const todoListEl = $("#todo-list");
  const todoClearBtn = $("#todo-clear");
  const filterChips = $$(".chip[data-filter]");

  let todos = storage.get(STORAGE_KEYS.TODOS, []);
  let currentFilter = "all";

  function renderTodos() {
    todoListEl.innerHTML = "";

    const filtered = todos.filter((t) => {
      if (currentFilter === "open") return !t.done;
      if (currentFilter === "done") return !!t.done;
      return true;
    });

    if (filtered.length === 0) {
      const empty = document.createElement("li");
      empty.className = "todo-item";
      empty.innerHTML = `<div class="todo-left"><p class="todo-title muted">Nenhuma tarefa aqui…</p></div>`;
      todoListEl.appendChild(empty);
      return;
    }

    filtered.forEach((t) => {
      const li = document.createElement("li");
      li.className = "todo-item";
      li.dataset.id = t.id;

      const left = document.createElement("div");
      left.className = "todo-left";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = !!t.done;
      checkbox.ariaLabel = "Marcar como concluída";
      checkbox.addEventListener("change", () => toggleTodo(t.id));

      const title = document.createElement("p");
      title.className = "todo-title" + (t.done ? " done" : "");
      title.textContent = t.title;

      left.appendChild(checkbox);
      left.appendChild(title);

      const actions = document.createElement("div");
      actions.className = "todo-actions";

      const delBtn = document.createElement("button");
      delBtn.className = "btn danger";
      delBtn.textContent = "Excluir";
      delBtn.addEventListener("click", () => deleteTodo(t.id));

      actions.appendChild(delBtn);

      li.appendChild(left);
      li.appendChild(actions);
      todoListEl.appendChild(li);
    });
  }

  function addTodo(title) {
    const todo = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title: title.trim(),
      done: false,
      createdAt: Date.now(),
    };
    todos.unshift(todo);
    storage.set(STORAGE_KEYS.TODOS, todos);
    renderTodos();
  }

  function toggleTodo(id) {
    todos = todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    storage.set(STORAGE_KEYS.TODOS, todos);
    renderTodos();
  }

  function deleteTodo(id) {
    todos = todos.filter((t) => t.id !== id);
    storage.set(STORAGE_KEYS.TODOS, todos);
    renderTodos();
  }

  function clearDone() {
    todos = todos.filter((t) => !t.done);
    storage.set(STORAGE_KEYS.TODOS, todos);
    renderTodos();
  }

  // Eventos ToDo
  todoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = todoInput.value.trim();
    if (!value) return;
    addTodo(value);
    todoInput.value = "";
    todoInput.focus();
  });

  todoClearBtn.addEventListener("click", clearDone);

  filterChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      currentFilter = chip.dataset.filter;
      filterChips.forEach((c) => c.classList.toggle("is-active", c === chip));
      renderTodos();
    });
  });

  renderTodos();

  /* =========================================================
     Serviços
     ========================================================= */
  const svcForm = $("#service-form");
  const svcId = $("#svc-id");
  const svcName = $("#svc-name");
  const svcType = $("#svc-type");
  const svcContact = $("#svc-contact");
  const svcCancel = $("#service-cancel");
  const svcTbody = $("#services-tbody");

  let services = storage.get(STORAGE_KEYS.SERVICES, []);

  function renderServices() {
    svcTbody.innerHTML = "";

    if (services.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 4;
      td.className = "muted";
      td.textContent = "Nenhum prestador cadastrado.";
      tr.appendChild(td);
      svcTbody.appendChild(tr);
      return;
    }

    services.forEach((s) => {
      const tr = document.createElement("tr");

      const tdName = document.createElement("td");
      tdName.textContent = s.name;

      const tdType = document.createElement("td");
      tdType.textContent = s.type;

      const tdContact = document.createElement("td");
      tdContact.textContent = s.contact;

      const tdActions = document.createElement("td");
      tdActions.className = "col-actions";

      const editBtn = document.createElement("button");
      editBtn.className = "btn outline";
      editBtn.textContent = "Editar";
      editBtn.addEventListener("click", () => fillFormForEdit(s.id));

      const delBtn = document.createElement("button");
      delBtn.className = "btn danger";
      delBtn.textContent = "Excluir";
      delBtn.addEventListener("click", () => deleteService(s.id));

      tdActions.appendChild(editBtn);
      tdActions.appendChild(delBtn);

      tr.appendChild(tdName);
      tr.appendChild(tdType);
      tr.appendChild(tdContact);
      tr.appendChild(tdActions);

      svcTbody.appendChild(tr);
    });
  }

  function resetServiceForm() {
    svcId.value = "";
    svcName.value = "";
    svcType.value = "";
    svcContact.value = "";
  }

  function fillFormForEdit(id) {
    const s = services.find((x) => x.id === id);
    if (!s) return;
    svcId.value = s.id;
    svcName.value = s.name;
    svcType.value = s.type;
    svcContact.value = s.contact;
    svcName.focus();
  }

  function upsertService(data) {
    if (data.id) {
      services = services.map((s) => (s.id === data.id ? { ...s, ...data } : s));
    } else {
      const { name, type, contact } = data;
      services.unshift({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        name,
        type,
        contact,
        createdAt: Date.now(),
      });
    }
    storage.set(STORAGE_KEYS.SERVICES, services);
    renderServices();
  }

  function deleteService(id) {
    services = services.filter((s) => s.id !== id);
    storage.set(STORAGE_KEYS.SERVICES, services);
    renderServices();
  }

  // Eventos Serviços
  svcForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = svcId.value || null;
    const name = svcName.value.trim();
    const type = svcType.value.trim();
    const contact = svcContact.value.trim();

    if (!name || !type || !contact) return;

    upsertService({ id, name, type, contact });
    resetServiceForm();
    svcName.focus();
  });

  svcCancel.addEventListener("click", (e) => {
    e.preventDefault();
    resetServiceForm();
  });

  renderServices();
})();
