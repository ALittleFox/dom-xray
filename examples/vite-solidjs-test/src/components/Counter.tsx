import { createSignal } from "solid-js";

export default function Counter() {
  const [count, setCount] = createSignal(0);

  return (
    <div class="counter">
      <h2>Counter</h2>
      <div class="value">{count()}</div>
      <div class="actions">
        <button onClick={() => setCount(count() - 1)}>-</button>
        <button onClick={() => setCount(count() + 1)}>+</button>
      </div>
    </div>
  );
}
