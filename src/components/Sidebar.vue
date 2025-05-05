<template>
  <nav :class="['sidebar', { expanded }]">
    <div class="sidebar-top">
      <button class="menu-btn" @click="toggle">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <rect y="6" width="32" height="2" rx="1" fill="#fff" />
          <rect y="15" width="32" height="2" rx="1" fill="#fff" />
          <rect y="24" width="32" height="2" rx="1" fill="#fff" />
        </svg>
      </button>
      <RouterLink
        to="/tasks"
        class="nav-link"
        :class="{ active: isActive('/tasks') }"
        @mouseenter="hovered = '/tasks'"
        @mouseleave="hovered = ''"
      >
        <img
          :src="
            isActive('/tasks') || hovered === '/tasks' ? tasksLapis : tasksWhite
          "
          height="32"
          width="32"
        />
        <span v-if="expanded">TASKS</span>
      </RouterLink>
    </div>
    <RouterLink
      to="/notifications"
      class="nav-link "
      :class="{ active: isActive('/notifications') }"
      @mouseenter="hovered = '/notifications'"
      @mouseleave="hovered = ''"
    >
      <img
        :src="
          isActive('/notifications') || hovered === '/notifications'
            ? notificationsLapis
            : notificationsWhite
        "
        height="32"
        width="32"
      />
      <span v-if="expanded">NOTIFICATIONS</span>
    </RouterLink>
    <div class="">
      <RouterLink
        to="/settings"
        class="nav-link"
        :class="{ active: isActive('/settings') }"
        @mouseenter="hovered = '/settings'"
        @mouseleave="hovered = ''"
      >
        <img
          :src="
            isActive('/settings') || hovered === '/settings'
              ? settingsLapis
              : settingsWhite
          "
          height="32"
          width="32"
        />
        <span v-if="expanded">SETTINGS</span>
      </RouterLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import notificationsWhite from "./../assets/notifications-white.svg";
import notificationsLapis from "./../assets/notifications-lapis.svg";
import tasksWhite from "./../assets/tasks-white.svg";
import tasksLapis from "./../assets/tasks-lapis.svg";
import settingsWhite from "./../assets/settings-white.svg";
import settingsLapis from "./../assets/settings-lapis.svg";

const expanded = ref(false);
const hovered = ref("");
const toggle = () => (expanded.value = !expanded.value);
const route = useRoute();
const isActive = (path: string) => route.path === path;
</script>

<style scoped>
.sidebar {
  width: 72px;
  background: #05668d;
  color: #fff;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  transition: width 0.3s ease;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 10;
}
.sidebar.expanded {
  width: 240px;
}
.sidebar-top {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  /* gap: 2rem; */
  /* padding: 1.5rem 0 1.5rem 1.5rem; */
}
.menu-btn {
  background: none;
  border: none;
  margin-bottom: 2rem;
  cursor: pointer;
  outline: none;
  margin-top: 2.5rem;
  padding: 0rem 0 0 1.3rem;
}
.nav-link {
  font-family: 'Roboto', Arial, Helvetica, sans-serif;
  font-size: 20px;
  font-weight: 300;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  line-height: 1.4;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #fff;
  text-decoration: none;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  transition: background 0.2s;
  /* border-radius: 8px; */
  padding: 0.5rem 1rem;
  width: -webkit-fill-available;
}

.nav-link:hover {
  background: #a8dadc;
  color: #05668d;
}

.nav-link.active {
  background: #fff;
  color: #05668d;
}
.sidebar-bottom {
  margin-top: auto;
  padding: 1.5rem 0 1.5rem 1.5rem;
}
span {
  letter-spacing: 1px;
}
</style>
