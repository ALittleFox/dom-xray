import Counter from "./components/Counter";
import TodoList from "./components/TodoList";

export default function App() {
  return (
    <main class="container">
      <h1>SolidJS + DOM Selector</h1>
      <p>
        按住 <kbd>⌘</kbd>（或 <kbd>Ctrl</kbd>）并点击任意元素，唤起源码弹窗。
      </p>

      <section class="card">
        <Counter />
      </section>

      <section class="card">
        <TodoList />
      </section>
    </main>
  );
}
