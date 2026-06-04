<template>
  <main class="container">
    <Header />
    <Card
      title="卡片 1"
      description="这是一个测试卡片。Command+点击这里试试。"
      button-text="按钮 A"
    />
    <Card
      title="卡片 2"
      description="另一个测试卡片。"
      button-text="按钮 B"
      button-variant="primary"
    />
  </main>
</template>

<script setup lang="ts">
import Header from '~/components/Header.vue'
import Card from '~/components/Card.vue'
</script>

<style>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
