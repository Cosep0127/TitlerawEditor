import { playerInput, typeSelector } from './dom.js';

export let cmdMode = 'minify';
export function setCmdMode(m) { cmdMode = m; }

export const state = {
  player: '@a',
  type: 'title',
  components: []
};

const MAX_HISTORY = 100;
let undoStack = [];
let redoStack = [];
export let editingIndex = -1;
export let insertAfterIndex = -1;
export function setEditingIndex(v) { editingIndex = v; }
export function setInsertAfterIndex(v) { insertAfterIndex = v; }

function snapshot() {
  return {
    player: state.player,
    type: state.type,
    components: state.components.map(c => ({ ...c }))
  };
}

function restore(snap) {
  state.player = snap.player;
  state.type = snap.type;
  state.components = snap.components.map(c => ({ ...c }));
  playerInput.value = state.player;
  typeSelector.querySelectorAll('.segmented-item').forEach(b => {
    b.classList.toggle('active', b.dataset.type === state.type);
  });
}

export function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack = [];
  updateHistoryButtons();
}

export function undo() {
  if (undoStack.length === 0) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  updateHistoryButtons();
  saveState();
}

export function redo() {
  if (redoStack.length === 0) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  updateHistoryButtons();
  saveState();
}

function updateHistoryButtons() {
  document.getElementById('undoBtn').disabled = undoStack.length === 0;
  document.getElementById('redoBtn').disabled = redoStack.length === 0;
}
export { updateHistoryButtons };

const STORAGE_KEY = 'titleraw-state';
export const THEME_KEY = 'titleraw-theme';
let saveTimer = null;

export function saveState() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, 500);
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (data && Array.isArray(data.components)) {
      state.player = data.player || '@a';
      state.type = data.type || 'title';
      state.components = data.components;
      return true;
    }
  } catch {}
  return false;
}

export function clearState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}
