<template>
  <div class="card">
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
    <button :class="buttonClass">{{ buttonText }}</button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description: string
  buttonText: string
  buttonVariant?: 'primary'
}

const props = defineProps<Props>()

const buttonClass = computed(() => {
  return props.buttonVariant ? `btn ${props.buttonVariant}` : 'btn'
})
</script>

<style scoped>
.card {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  background: #fafafa;
}
.card h2 {
  font-size: 20px;
  margin-bottom: 8px;
  color: red;
}
.card p {
  color: #666;
  margin-bottom: 16px;
}
.btn {
  padding: 8px 16px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
.btn.primary {
  background: red;
  color: #fff;
  border-color: red;
}
</style>
