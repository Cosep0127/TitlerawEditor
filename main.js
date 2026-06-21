const playerInput = document.getElementById('playerInput');
const typeSelector = document.getElementById('typeSelector');
const componentsList = document.getElementById('componentsList');
const commandPreview = document.getElementById('commandPreview');
const copyBtn = document.getElementById('copyBtn');
const addBtn = document.getElementById('addComponentBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const vTitle = document.getElementById('vTitle');
const vSubtitle = document.getElementById('vSubtitle');
const vActionbar = document.getElementById('vActionbar');
const refColorGrid = document.getElementById('refColorGrid');
const refMaterialGrid = document.getElementById('refMaterialGrid');
const refOtherGrid = document.getElementById('refOtherGrid');
const refFormatRow = document.getElementById('refFormatRow');
const importInput = document.getElementById('importInput');
const importError = document.getElementById('importError');

const themeToggle = document.getElementById('themeToggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle.textContent = theme === 'dark' ? '☾' : '☀';
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) { applyTheme(saved); return; }
  applyTheme(prefersDark.matches ? 'dark' : 'light');
}

themeToggle.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  themeToggle.classList.remove('spin');
  void themeToggle.offsetWidth;
  themeToggle.classList.add('spin');
  applyTheme(next);
});

prefersDark.addEventListener('change', (e) => {
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
    cmdMode = tab.dataset.mode;
    updateIndicator('cmdTabs');
    updateCommandPreview();
  });
});

document.getElementById('undoBtn').addEventListener('click', undo);
document.getElementById('redoBtn').addEventListener('click', redo);

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
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
