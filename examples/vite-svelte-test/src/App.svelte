<script lang="ts">
  import Counter from "./components/Counter.svelte";
  import TodoList from "./components/TodoList.svelte";
</script>

<main class="container">
  <h1>Svelte + DOM Selector</h1>
  <p>按住 <kbd>⌘</kbd>（或 <kbd>Ctrl</kbd>）并点击任意元素，唤起源码弹窗。</p>

  <section class="card">
    <Counter />
  </section>

  <section class="card">
    <TodoList />
  </section>
</main>

<style>
  .container {
    max-width: 640px;
    margin: 0 auto;
    padding: 40px 24px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  h1 {
    margin-bottom: 8px;
  }
  p {
    color: #666;
    margin-bottom: 24px;
  }
  kbd {
    background: #f0f0f0;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9em;
  }
  .card {
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
  }
</style>
