<script lang="ts">
  let count = $state(0);
</script>

<div class="counter">
  <h2>Counter</h2>
  <div class="value">{count}</div>
  <div class="actions">
    <button onclick={() => count--}>-</button>
    <button onclick={() => count++}>+</button>
  </div>
</div>

<style>
  .counter {
    text-align: center;
  }
  h2 {
    margin: 0 0 16px;
    font-size: 1.25rem;
  }
  .value {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 16px;
    color: #333;
  }
  .actions {
    display: flex;
    gap: 12px;
    justify-content: center;
  }
  button {
    width: 48px;
    height: 48px;
    font-size: 1.25rem;
    border: 1px solid #d9d9d9;
    background: #fff;
    border-radius: 8px;
    cursor: pointer;
  }
  button:hover {
    background: #f5f5f5;
  }
</style>
