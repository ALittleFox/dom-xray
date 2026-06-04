<template>
  <div class="todo">
    <h2>Todo List</h2>
    <div class="input-row">
      <input
        type="text"
        v-model="inputValue"
        placeholder="输入待办事项"
        @keydown.enter="addTodo"
      />
      <button @click="addTodo">添加</button>
    </div>
    <ul>
      <li
        v-for="todo in todos"
        :key="todo.id"
        class="item"
        :class="{ done: todo.done }"
      >
        <span class="text" @click="toggleTodo(todo.id)">{{ todo.text }}</span>
        <button class="remove" @click="removeTodo(todo.id)">×</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from "vue";

const todos = ref([
  { id: 1, text: "学习 Vue 3", done: false },
  { id: 2, text: "集成 DOM Selector", done: true },
  { id: 3, text: "测试源码映射", done: false },
]);

const inputValue = ref("");

function addTodo() {
  if (!inputValue.value.trim()) return;
  todos.value.push({
    id: Date.now(),
    text: inputValue.value.trim(),
    done: false,
  });
  inputValue.value = "";
}

function toggleTodo(id) {
  const todo = todos.value.find((t) => t.id === id);
  if (todo) todo.done = !todo.done;
}

function removeTodo(id) {
  todos.value = todos.value.filter((t) => t.id !== id);
}
</script>

<style scoped>
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
