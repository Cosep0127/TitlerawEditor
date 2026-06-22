import { THEME_KEY, state, cmdMode, setCmdMode, editingIndex, insertAfterIndex, pushUndo, undo, redo, saveState, loadState, clearState } from './state.js';
import { debounce, generateId } from './utils.js';
import { playerInput, typeSelector, componentsList, commandPreview, copyBtn, addBtn, clearAllBtn, vTitle, vSubtitle, vActionbar, importInput, importError, themeToggle, logoBtn } from './dom.js';
import { renderComponents } from './components.js';
import { showToast, openModal, closeModal, updateIndicator, buildReferenceCard, openAddModal, updateAddFields, updateAddCompIndicator } from './ui.js';
import { generateCommand, updateCommandPreview } from './generator.js';
import { updateAll } from './preview.js';
import { doImport } from './parser.js';

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle.textContent = theme === 'dark' ? '☾' : '☀';
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) { applyTheme(saved); return; }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  applyTheme(prefersDark.matches ? 'dark' : 'light');
}

themeToggle.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  themeToggle.classList.remove('spin');
  void themeToggle.offsetWidth;
  themeToggle.classList.add('spin');
  applyTheme(next);
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem(THEME_KEY)) {
    applyTheme(e.matches ? 'dark' : 'light');
  }
});

const debouncedFieldUpdate = debounce(() => { updateAll(); saveState(); }, 150);

playerInput.addEventListener('input', () => {
  state.player = playerInput.value || '@a';
  debouncedFieldUpdate();
});

document.querySelectorAll('.chip').forEach(btn => {
  btn.addEventListener('click', () => {
    pushUndo();
    state.player = btn.dataset.value;
    playerInput.value = state.player;
    updateAll();
    saveState();
  });
});

typeSelector.querySelectorAll('.segmented-item').forEach(btn => {
  btn.addEventListener('click', () => {
    pushUndo();
    typeSelector.querySelectorAll('.segmented-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.type = btn.dataset.type;
    updateIndicator('typeSelector');
    updateAll();
    saveState();
  });
});

addBtn.addEventListener('click', () => openAddModal());

document.querySelectorAll('#addCompTypeGroup .add-comp-type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#addCompTypeGroup .add-comp-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateAddFields(btn.dataset.type);
    updateAddCompIndicator();
  });
});

document.getElementById('addModalConfirm').addEventListener('click', () => {
  const active = document.querySelector('#addCompTypeGroup .active');
  const type = active ? active.dataset.type : 'text';
  const comp = {
    id: editingIndex >= 0 ? state.components[editingIndex].id : generateId(),
    type, text: '', selector: '@p',
    scoreName: '', scoreObjective: '', translate: '', with: '',
  };
  switch (type) {
    case 'text': comp.text = document.getElementById('addCompText')?.value || ''; break;
    case 'selector': comp.selector = document.getElementById('addCompSelector')?.value || '@p'; break;
    case 'score': comp.scoreName = document.getElementById('addCompScoreName')?.value || ''; comp.scoreObjective = document.getElementById('addCompScoreObjective')?.value || ''; break;
    case 'translate': comp.translate = document.getElementById('addCompTranslate')?.value || ''; comp.with = document.getElementById('addCompWith')?.value || ''; break;
  }
  pushUndo();
  if (editingIndex >= 0) {
    state.components[editingIndex] = comp;
  } else if (insertAfterIndex >= 0) {
    state.components.splice(insertAfterIndex + 1, 0, comp);
  } else {
    state.components.push(comp);
  }
  renderComponents();
  saveState();
  closeModal('addModal');
});

clearAllBtn.addEventListener('click', () => {
  if (state.components.length === 0) return;
  if (!confirm('确定要清空所有组件吗？')) return;
  pushUndo();
  state.components = [];
  renderComponents();
  clearState();
  showToast('已清空');
});

copyBtn.addEventListener('click', () => {
  const cmd = generateCommand();
  navigator.clipboard.writeText(cmd).then(() => showToast('已复制命令'))
    .catch(() => showToast('复制失败'));
});

document.querySelectorAll('.cmd-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.cmd-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    setCmdMode(tab.dataset.mode);
    updateIndicator('cmdTabs');
    updateCommandPreview();
  });
});

function handleUndo() {
  undo();
  renderComponents();
  updateIndicator('typeSelector');
}

function handleRedo() {
  redo();
  renderComponents();
  updateIndicator('typeSelector');
}

document.getElementById('undoBtn').addEventListener('click', handleUndo);
document.getElementById('redoBtn').addEventListener('click', handleRedo);

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo(); }
});

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.closest('.modal-overlay').classList.remove('open');
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  }
});

document.getElementById('openImportBtn').addEventListener('click', () => {
  importInput.value = '';
  importError.textContent = '';
  openModal('importModal');
});

logoBtn.addEventListener('click', () => openModal('advModal'));

document.getElementById('openRefBtn').addEventListener('click', () => {
  openModal('refModal');
});

document.getElementById('importModalConfirm').addEventListener('click', doImport);

importInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.ctrlKey) doImport();
});

initTheme();
buildReferenceCard();

if (loadState()) {
  playerInput.value = state.player;
  typeSelector.querySelectorAll('.segmented-item').forEach(b => {
    b.classList.toggle('active', b.dataset.type === state.type);
  });
}

renderComponents();
updateIndicator('typeSelector');
updateIndicator('cmdTabs');
