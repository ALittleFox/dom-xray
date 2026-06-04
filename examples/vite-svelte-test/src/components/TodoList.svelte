<script lang="ts">
  interface Todo {
    id: number;
    text: string;
    done: boolean;
  }

  let todos = $state<Todo[]>([
    { id: 1, text: "学习 Svelte 5", done: false },
    { id: 2, text: "集成 DOM Selector", done: true },
    { id: 3, text: "测试源码映射", done: false },
  ]);

  let inputValue = $state("");

  function addTodo() {
    if (!inputValue.trim()) return;
    todos = [...todos, { id: Date.now(), text: inputValue.trim(), done: false }];
    inputValue = "";
  }

  function toggleTodo(id: number) {
    todos = todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
  }

  function removeTodo(id: number) {
    todos = todos.filter((t) => t.id !== id);
  }
</script>

<div class="todo">
  <h2>Todo List</h2>
  <div class="input-row">
    <input
      type="text"
      placeholder="输入待办事项"
      bind:value={inputValue}
      onkeydown={(e) => e.key === "Enter" && addTodo()}
    />
    <button onclick={addTodo}>添加</button>
  </div>
  <ul>
    {#each todos as todo (todo.id)}
      <li class="item" class:done={todo.done}>
        <span class="text" onclick={() => toggleTodo(todo.id)}>{todo.text}</span>
        <button class="remove" onclick={() => removeTodo(todo.id)}>×</button>
      </li>
    {/each}
  </ul>
</div>

<style>
  .todo {
    text-align: left;
  }
  h2 {
    margin: 0 0 16px;
    font-size: 1.25rem;
  }
  .input-row {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }
  input[type="text"] {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    font-size: 1rem;
  }
  button {
    padding: 8px 16px;
    border: 1px solid #d9d9d9;
    background: #fff;
    border-radius: 8px;
    cursor: pointer;
  }
  button:hover {
    background: #f5f5f5;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    margin-bottom: 8px;
  }
  .item.done .text {
    text-decoration: line-through;
    color: #999;
  }
  .text {
    cursor: pointer;
    flex: 1;
  }
  .remove {
    color: #ff4d4f;
    border: none;
    background: transparent;
    font-size: 1.25rem;
    padding: 0 4px;
  }
</style>
