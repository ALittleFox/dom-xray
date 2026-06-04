import { createSignal, For } from "solid-js";

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

export default function TodoList() {
  const [todos, setTodos] = createSignal<Todo[]>([
    { id: 1, text: "学习 SolidJS", done: false },
    { id: 2, text: "集成 DOM Selector", done: true },
    { id: 3, text: "测试源码映射", done: false },
  ]);
  const [inputValue, setInputValue] = createSignal("");

  const addTodo = () => {
    if (!inputValue().trim()) return;
    setTodos((prev) => [
      ...prev,
      { id: Date.now(), text: inputValue().trim(), done: false },
    ]);
    setInputValue("");
  };

  const toggleTodo = (id: number) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const removeTodo = (id: number) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div class="todo">
      <h2>Todo List</h2>
      <div class="input-row">
        <input
          type="text"
          placeholder="输入待办事项"
          value={inputValue()}
          onInput={(e) => setInputValue(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
        />
        <button onClick={addTodo}>添加</button>
      </div>
      <ul>
        <For each={todos()}>
          {(todo) => (
            <li class="item" classList={{ done: todo.done }}>
              <span class="text" onClick={() => toggleTodo(todo.id)}>
                {todo.text}
              </span>
              <button class="remove" onClick={() => removeTodo(todo.id)}>
                ×
              </button>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}
