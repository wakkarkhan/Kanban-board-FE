<template>
  <h1 class="page-title">Tasks</h1>

  <div class="kanban-board">
    <div
      class="kanban-column"
      :class="{ 'drop-restricted': isDragging && !isDropAllowed(colIdx) }"
      v-for="(col, colIdx) in columns"
      :key="col.status"
      @dragover.prevent="onDragOver(col.status, colIdx, $event)"
      @drop="onDrop(col.status, colIdx)"
    >
      <h2>{{ col.label }}</h2>
      <transition-group name="card-move" tag="div" class="kanban-card-list">
        <template v-for="(card, idx) in cardsByStatus[col.status]">
          <!-- Only show placeholder in the source column -->
          <div
            v-if="isDragging && dragOverColumn === draggedFrom && col.status === draggedFrom && idx === draggedOriginalIdx"
            :key="'placeholder-' + col.status + '-' + idx"
            class="kanban-card placeholder-card"
          ></div>
          <div
            v-if="!isDragging || card.id !== draggedCard?.id"
            :key="card.id"
            class="kanban-card"
            :style="{ background: card.color, opacity: isDragging && draggedCard && card.id === draggedCard.id ? 0.3 : 1 }"
            draggable="true"
            @dragstart="onDragStart(card, col.status, colIdx, $event)"
            @dragend="onDragEnd"
          >
            <p>{{ card.title }}</p>
          </div>
        </template>
      </transition-group>
    </div>
  </div>

  <div v-if="dialogOpen" class="dialog-overlay">
    <div class="dialog-box">
      <div class="dialog-header">CARD UPDATED</div>
      <pre class="dialog-json">{{ formattedDialogCard }}</pre>
      <div class="dialog-divider"></div>
      <button class="dialog-close" @click="dialogOpen = false">CLOSE</button>
    </div>
  </div>
  <div v-if="isDragging && ghostCard" :style="ghostCardStyle" class="ghost-card kanban-card">
    <p>{{ ghostCard.title }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, onMounted, ref } from "vue";

const columns = [
  { label: "TO-DO", status: "to-do" },
  { label: "IN-PROGRESS", status: "in-progress" },
  { label: "DONE", status: "done" },
];

// Group cards by status for easier manipulation
const cardsByStatus = reactive({
  'to-do': [],
  'in-progress': [],
  'done': []
});

const draggedCard = ref(null);
const draggedFrom = ref(null);
const draggedFromIdx = ref(null);
const draggedOriginalIdx = ref(null);
const isDragging = ref(false);
const ghostCard = ref(null);
const ghostCardStyle = ref({});
const dialogOpen = ref(false);
const dialogCard = ref(null);
const dragOverColumn = ref(null);
let wasDropped = false;

onMounted(async () => {
  const res = await fetch("https://q1z3telex7a9metry.denaliops.com/data.json");
  const data = await res.json();
  data.forEach((card, idx) => card.id = idx + 1);
  // Distribute cards by status
  columns.forEach(col => cardsByStatus[col.status].splice(0, cardsByStatus[col.status].length));
  data.forEach(card => cardsByStatus[card.status].push(card));
});

function onDragStart(card, fromStatus, fromIdx, event) {
  draggedCard.value = card;
  console.log(draggedCard.value)
  draggedFrom.value = fromStatus;
  draggedFromIdx.value = columns.findIndex(col => col.status === fromStatus);
  draggedOriginalIdx.value = cardsByStatus[fromStatus].findIndex(c => c.id === card.id);
  isDragging.value = true;
  ghostCard.value = card;
  wasDropped = false;
  // Remove card from source column immediately
  const idx = cardsByStatus[fromStatus].findIndex(c => c.id === card.id);
  if (idx !== -1) cardsByStatus[fromStatus].splice(idx, 1);
  // Use the ghost card as the drag image
  setTimeout(() => {
    const el = document.querySelector('.ghost-card');
    if (el && event.dataTransfer) {
      event.dataTransfer.setDragImage(el, el.offsetWidth / 2, el.offsetHeight / 2);
    }
  }, 0);
  // Listen for mousemove to move ghost card
  window.addEventListener('mousemove', onMouseMoveGhost);
  window.addEventListener('touchmove', onTouchMoveGhost);
}

function onMouseMoveGhost(e) {
  ghostCardStyle.value = {
    position: 'fixed',
    left: e.clientX + 10 + 'px',
    top: e.clientY + 10 + 'px',
    pointerEvents: 'none',
    zIndex: 9999,
    width: '140px',
    opacity: 0.95
  };
}
function onTouchMoveGhost(e) {
  if (!e.touches || !e.touches[0]) return;
  ghostCardStyle.value = {
    position: 'fixed',
    left: e.touches[0].clientX + 10 + 'px',
    top: e.touches[0].clientY + 10 + 'px',
    pointerEvents: 'none',
    zIndex: 9999,
    width: '140px',
    opacity: 0.95
  };
}

function onDragOver(targetStatus, targetIdx, event) {
  if (!isDragging.value || !draggedFrom.value) return;
  const fromIdx = draggedFromIdx.value;
  // Only allow drag over adjacent columns or the original column
  if (
    targetIdx === fromIdx ||
    targetIdx === fromIdx + 1 ||
    targetIdx === fromIdx - 1
  ) {
    event.preventDefault();
    dragOverColumn.value = targetStatus;
  }
  // Otherwise, do not update dragOverColumn (card will not move further)
}

function onDrop(targetStatus, targetIdx) {
  if (!isDragging.value || !draggedCard.value || !draggedFrom.value) return;
  wasDropped = true;
  const fromIdx = draggedFromIdx.value;
  let allowedIdx = fromIdx;
  if (targetIdx > fromIdx) allowedIdx = fromIdx + 1;
  else if (targetIdx < fromIdx) allowedIdx = fromIdx - 1;
  allowedIdx = Math.max(0, Math.min(columns.length - 1, allowedIdx));
  const allowedStatus = columns[allowedIdx].status;
  const moved = allowedStatus !== draggedFrom.value;
  // If dropped in original column, insert at original index
  if (allowedStatus === draggedFrom.value) {
    cardsByStatus[allowedStatus].splice(draggedOriginalIdx.value, 0, { ...draggedCard.value, status: allowedStatus });
  } else {
    cardsByStatus[allowedStatus].splice(0, 0, { ...draggedCard.value, status: allowedStatus });
  }
  if (moved) {
    setTimeout(() => {
      dialogCard.value = { ...draggedCard.value, status: allowedStatus };
      dialogOpen.value = true;
    }, 350);
  }
  cleanupDrag();
}

function onDragEnd() {
  dragOverColumn.value = null;
  if (!wasDropped && draggedCard.value && draggedFrom.value) {
    // Restore card to original column and position
    cardsByStatus[draggedFrom.value].splice(draggedOriginalIdx.value, 0, draggedCard.value);
  }
  cleanupDrag();
}

function cleanupDrag() {
  isDragging.value = false;
  // ghostCard.value = null;
  draggedCard.value = null;
  draggedFrom.value = null;
  draggedFromIdx.value = null;
  draggedOriginalIdx.value = null;
  ghostCardStyle.value = {};
  window.removeEventListener('mousemove', onMouseMoveGhost);
  window.removeEventListener('touchmove', onTouchMoveGhost);
}

const formattedDialogCard = computed(() => {
  if (!dialogCard.value) return '';
  return {
    title: ghostCard.value.title, 
    color: ghostCard.value.color,
    status: dialogCard.value.status
  };
});

function isDropAllowed(targetIdx) {
  if (!isDragging.value || !draggedFrom.value) return false;
  const fromIdx = draggedFromIdx.value;
  return (
    targetIdx === fromIdx ||
    targetIdx === fromIdx + 1 ||
    targetIdx === fromIdx - 1
  );
}
</script>

<style scoped>
.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  justify-content: center;
  align-items: stretch;
  padding: 2rem 0rem;
  width: 100%;
  box-sizing: border-box;
}

p{
  margin: 0;
  text-transform:  uppercase;
}

h2{
  margin: 10px 0px 35px 0px !important

}

.kanban-column {
  background: #fff;
  border: 3px solid #222;
  border-radius: 6px;
  min-width: 260px;
  padding: 2rem 1.5rem 1rem 1.5rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  height: 100%;
}
.kanban-column h3 {
  font-size: 1.5rem;
  font-weight: 400;
  margin-bottom: 2rem;
  letter-spacing: 1px;
}
.kanban-card-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.kanban-card {
  border: 2px solid #222;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  padding: 1.2rem 1rem;
  font-size: 1.1rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  background: #eee;
  transition: box-shadow 0.2s, transform 0.5s cubic-bezier(.22,1,.36,1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  cursor: grab;
  min-height: 45px;
  display: flex;
  align-items: center;
}
.kanban-card:hover {
  border: 2.3px solid #222;
  box-shadow: 0 0 4px 1px rgba(40, 38, 44, 0.36);
  z-index: 2;
  transition: box-shadow 0.18s cubic-bezier(.4,2,.6,1);
}
.card-move{
  transition: transform 0.5s cubic-bezier(.22,1,.36,1);
  z-index: 1;
}
.ghost-card {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  background: #fff;
  border: 2px solid #222;
  border-radius: 6px;
  min-width: 140px;
  max-width: 140px;
  min-height: 45px;
  box-shadow: 0 0 4px 1px rgba(40, 38, 44, 0.36);
  opacity: 0.95;
  display: flex;
  align-items: center;
  padding: 1.2rem 1rem;
}
@media (max-width: 1100px) {
  .kanban-board {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 1024px) {
  .kanban-board {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }
  .kanban-column {
    min-width: 0;
    width: 100%;
    margin-bottom: 2.5rem;
  }
  .kanban-card-list {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .kanban-card {
    min-width: 140px;
    max-width: 140px;
    flex: 1 1 40%;
    min-height: 130px;
  }
}
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.dialog-box {
  font-family: 'Roboto', Arial, Helvetica, sans-serif;
  font-size: 20px;
  font-weight: 300;
  letter-spacing: 0.01em;
  line-height: 1.4;
  margin-bottom: 12px;
  background: #fff;
  border-radius: 6px;
  min-width: 400px;
  max-width: 90vw;
  min-height: 180px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  border: 1px solid #000;
  box-shadow: 0 0 4px 1px rgba(40, 38, 44, 0.36);
}
.dialog-header {
  background: #197193;
  color: #fff;
  font-size: 20px;
  font-weight: 400;
  padding: 18px 20px 14px 20px;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  font-family: 'Roboto', Arial, Helvetica, sans-serif;
}
.dialog-json {
  font-family: 'Roboto Mono', 'Roboto', monospace;
  font-size: 16px;
  color: #213547;
  padding: 18px 20px 18px 20px;
  margin: 0;
  background: #fff;
  white-space: pre-wrap;
  font-weight: 300;
}
.dialog-divider {
  border-top: 1px solid #A8DADC;
  margin: 0 0 0 0;
}
.dialog-close {
  align-self: flex-end;
  background: none;
  border: none;
  color: #197193;
  font-size: 16px;
  font-weight: 500;
  padding: 12px 20px 12px 20px;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  font-family: 'Roboto', Arial, Helvetica, sans-serif;
  /* text-decoration: underline; */
  margin-bottom: 0px;
}
.placeholder-card {
  background: transparent !important;
  border: 0px dashed #bbb;
  min-height: 5px;
  max-height: 5px;
  /* margin-bottom: 1.5rem; */
  pointer-events: none;
  box-shadow: none !important;
}
.drop-restricted {
  opacity: 0.5;
  filter: grayscale(0.7);
  cursor: not-allowed !important;
  position: relative;
}
.drop-restricted::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(220, 53, 69, 0.08); /* subtle red overlay */
  pointer-events: none;
  border: 2px dashed #dc3545;
  border-radius: 6px;
}
</style>
