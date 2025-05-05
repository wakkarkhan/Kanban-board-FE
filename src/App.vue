<script setup lang="ts">
import Sidebar from './components/Sidebar.vue'
</script>

<template>
  <div class="app-layout">
    <Sidebar />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
}
.main-content {
  flex: 1;
  margin-left: 80px;
  transition: margin-left 0.3s ease;
  background-color: #f9f9f9 !important;
  min-height: 100vh;
}
.sidebar.expanded ~ .main-content {
  margin-left: 250px;
}
</style>
