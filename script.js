const COLORS = [
  { code: '0', name: 'black',           display: '黑色',         hex: '#000000' },
  { code: '1', name: 'dark_blue',       display: '深蓝色',       hex: '#0000AA' },
  { code: '2', name: 'dark_green',      display: '深绿色',       hex: '#00AA00' },
  { code: '3', name: 'dark_aqua',       display: '暗水蓝色',     hex: '#00AAAA' },
  { code: '4', name: 'dark_red',        display: '深红色',       hex: '#AA0000' },
  { code: '5', name: 'dark_purple',     display: '深紫色',       hex: '#AA00AA' },
  { code: '6', name: 'gold',            display: '金色',         hex: '#FFAA00' },
  { code: '7', name: 'gray',            display: '灰色',         hex: '#AAAAAA' },
  { code: '8', name: 'dark_gray',       display: '深灰色',       hex: '#555555' },
  { code: '9', name: 'blue',            display: '蓝色',         hex: '#5555FF' },
  { code: 'a', name: 'green',           display: '绿色',         hex: '#55FF55' },
  { code: 'b', name: 'aqua',            display: '水蓝色',       hex: '#55FFFF' },
  { code: 'c', name: 'red',             display: '红色',         hex: '#FF5555' },
  { code: 'd', name: 'light_purple',    display: '淡紫色',       hex: '#FF55FF' },
  { code: 'e', name: 'yellow',          display: '黄色',         hex: '#FFFF55' },
  { code: 'f', name: 'white',           display: '白色',         hex: '#FFFFFF' },
  { code: 'g', name: 'minecoin_gold',   display: 'Minecoin金',   hex: '#DDD605' },
  { code: 'h', name: 'material_quartz',  display: '石英',       hex: '#E3D4D1' },
  { code: 'i', name: 'material_iron',    display: '铁锭',       hex: '#CECACA' },
  { code: 'j', name: 'material_netherite', display: '下界合金',  hex: '#443A3B' },
  { code: 'm', name: 'material_redstone',  display: '红石',     hex: '#971607' },
  { code: 'n', name: 'material_copper',    display: '铜锭',     hex: '#B4684D' },
  { code: 'p', name: 'material_gold',      display: '金锭',     hex: '#DEB12D' },
  { code: 'q', name: 'material_emerald',   display: '绿宝石',   hex: '#11A036' },
  { code: 's', name: 'material_diamond',   display: '钻石',     hex: '#2CBAA8' },
  { code: 't', name: 'material_lapis',     display: '青金石',   hex: '#21497B' },
  { code: 'u', name: 'material_amethyst',  display: '紫水晶',   hex: '#9A5CC6' },
  { code: 'v', name: 'material_resin',     display: '树脂',     hex: '#EB7114' },
  { code: 'w', name: 'party_blue_color',   display: '组队蓝',   hex: '#8CB3FF' },
];

const FORMAT_COLORS = new Map(COLORS.map(c => [c.code, c]));

const COLOR_TO_CODE = {
  black: '0', dark_blue: '1', dark_green: '2', dark_aqua: '3',
  dark_red: '4', dark_purple: '5', gold: '6', gray: '7',
  dark_gray: '8', blue: '9', green: 'a', aqua: 'b',
  red: 'c', light_purple: 'd', yellow: 'e', white: 'f',
  minecoin_gold: 'g', material_quartz: 'h', material_iron: 'i',
  material_netherite: 'j', material_redstone: 'm', material_copper: 'n',
  material_gold: 'p', material_emerald: 'q', material_diamond: 's',
  material_lapis: 't', material_amethyst: 'u', material_resin: 'v',
  party_blue_color: 'w',
};

const FORMAT_MAP = {
  l: 'bold', L: 'bold',
  o: 'italic', O: 'italic',
  k: 'obfuscated', K: 'obfuscated',
  r: 'reset', R: 'reset',
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function debounce(fn, ms) {
  let t;
  return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
}

let cmdMode = 'format';

const state = {
  player: '@a',
  type: 'title',
  components: []
};

// ─── Undo / Redo ───

const MAX_HISTORY = 100;
let undoStack = [];
let redoStack = [];

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
  updateIndicator('typeSelector');
}

function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack = [];
  updateHistoryButtons();
}

function undo() {
  if (undoStack.length === 0) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  renderComponents();
  updateHistoryButtons();
  saveState();
}

function redo() {
  if (redoStack.length === 0) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  renderComponents();
  updateHistoryButtons();
  saveState();
}

function updateHistoryButtons() {
  document.getElementById('undoBtn').disabled = undoStack.length === 0;
  document.getElementById('redoBtn').disabled = redoStack.length === 0;
}

// ─── localStorage ───

const STORAGE_KEY = 'titleraw-state';
const THEME_KEY = 'titleraw-theme';
let saveTimer = null;

function saveState() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, 500);
}

function loadState() {
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

function clearState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

// ─── Theme ───

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

// ─── DOM Refs ───

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

// ─── Collapsible Cards ───

// ─── Reference Card ───

const STANDARD_CODES = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
const MATERIAL_CODES = ['h','i','j','m','n','p','q','s','t','u','v'];
const OTHER_CODES = ['g','w'];

function buildReferenceCard() {
  STANDARD_CODES.forEach(code => {
    refColorGrid.appendChild(createColorCard(code));
  });
  MATERIAL_CODES.forEach(code => {
    refMaterialGrid.appendChild(createColorCard(code));
  });
  OTHER_CODES.forEach(code => {
    refOtherGrid.appendChild(createColorCard(code));
  });

  refFormatRow.querySelectorAll('.ref-format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      copyCode(btn.dataset.code, btn.textContent.trim());
    });
  });
}

function createColorCard(code) {
  const color = FORMAT_COLORS.get(code);
  if (!color) return document.createDocumentFragment();

  const card = document.createElement('div');
  card.className = 'color-card';
  card.addEventListener('click', () => copyCode('§' + code, color.display + ' §' + code));

  const swatch = document.createElement('div');
  swatch.className = 'color-card-swatch';
  swatch.style.background = color.hex;
  if (['white', 'material_quartz', 'material_iron'].includes(color.name)) {
    swatch.style.border = '2px solid var(--border)';
  }

  const info = document.createElement('div');
  info.className = 'color-card-info';

  const codeEl = document.createElement('span');
  codeEl.className = 'color-card-code';
  codeEl.textContent = '§' + code;

  const nameEl = document.createElement('span');
  nameEl.className = 'color-card-name';
  nameEl.textContent = color.display;

  info.appendChild(codeEl);
  info.appendChild(nameEl);
  card.appendChild(swatch);
  card.appendChild(info);
  return card;
}

function copyCode(code, label) {
  navigator.clipboard.writeText(code).then(() => {
    showToast('已复制 ' + label);
  }).catch(() => showToast('复制失败'));
}

// ─── Import ───

function doImport() {
  const raw = importInput.value.trim();
  if (!raw) { importError.textContent = '请粘贴命令或 JSON'; return; }

  if (state.components.length > 0) {
    if (!confirm('导入将替换当前所有组件，是否继续？')) return;
  }

  try {
    pushUndo();
    const result = parseImport(raw);
    if (result.player !== null) {
      state.player = result.player;
      playerInput.value = result.player;
    }
    if (result.type !== null) {
      state.type = result.type;
      typeSelector.querySelectorAll('.segmented-item').forEach(b => {
        b.classList.toggle('active', b.dataset.type === result.type);
      });
      updateIndicator('typeSelector');
    }
    state.components = result.components.length ? result.components : [{ id: generateId(), type: 'text', text: '', selector: '@p', scoreName: '', scoreObjective: '', translate: '', with: '' }];
    importError.textContent = '';
    renderComponents();
    showToast('导入成功');
    saveState();
    closeModal('importModal');
  } catch (e) {
    importError.textContent = e.message;
  }
}

function parseImport(text) {
  text = text.trim();

  let jsonStr = text;
  let player = null;
  let type = null;

  const cmdMatch = text.match(/^\/?titleraw\s+(\S+)\s+(\S+)\s+([\s\S]+)$/i);
  if (cmdMatch) {
    player = cmdMatch[1];
    type = cmdMatch[2];
    jsonStr = cmdMatch[3].trim();
  }

  jsonStr = jsonStr.replace(/\/\s*$/, '').trim();

  const parsed = JSON.parse(jsonStr);
  let rawtext = [];

  if (Array.isArray(parsed)) {
    rawtext = parsed;
  } else if (parsed && parsed.rawtext && Array.isArray(parsed.rawtext)) {
    rawtext = parsed.rawtext;
  } else if (parsed && typeof parsed === 'object') {
    rawtext = [parsed];
  }

  const components = rawtext.map(item => {
    const comp = {
      id: generateId(), type: 'text', text: '',
      selector: '@p', scoreName: '', scoreObjective: '',
      translate: '', with: '',
    };

    if (item.text !== undefined) {
      comp.type = 'text';
      let prefix = '';
      if (item.color && COLOR_TO_CODE[item.color]) prefix += '§' + COLOR_TO_CODE[item.color];
      if (item.bold) prefix += '§l';
      if (item.italic) prefix += '§o';
      if (item.obfuscated) prefix += '§k';
      comp.text = prefix + (item.text || '');
    } else if (item.selector !== undefined) {
      comp.type = 'selector';
      comp.selector = item.selector;
    } else if (item.score !== undefined) {
      comp.type = 'score';
      comp.scoreName = (item.score && item.score.name) || '';
      comp.scoreObjective = (item.score && item.score.objective) || '';
    } else if (item.translate !== undefined) {
      comp.type = 'translate';
      comp.translate = item.translate || '';
      if (item.with && Array.isArray(item.with)) {
        comp.with = item.with.join(', ');
      } else if (item.with) {
        comp.with = String(item.with);
      }
    } else {
      comp.text = JSON.stringify(item);
    }

    return comp;
  });

  return { player, type, components };
}

// ─── Render Components (Incremental) ───

function renderComponents() {
  const existing = new Map();
  componentsList.querySelectorAll('.component-card').forEach(el => {
    existing.set(el.dataset.id, el);
  });

  if (state.components.length === 0) {
    componentsList.innerHTML = '';
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = '点击「+ 添加组件」开始编辑';
    componentsList.appendChild(empty);
  } else {
    const fragment = document.createDocumentFragment();
    const usedIds = new Set();

    state.components.forEach((comp, i) => {
      usedIds.add(comp.id);
      let el = existing.get(comp.id);
      if (el) {
        updateComponentElement(el, comp, i);
      } else {
        el = createComponentElement(comp, i);
      }
      fragment.appendChild(el);
    });

    componentsList.innerHTML = '';
    componentsList.appendChild(fragment);
  }
  updateAll();
}

function updateComponentElement(el, comp, index) {
  const select = el.querySelector('.comp-type-select');
  if (select && select.value !== comp.type) {
    select.value = comp.type;
  }

  const upBtn = el.querySelector('.comp-arrow:first-child');
  const downBtn = el.querySelector('.comp-arrow:last-child');
  if (upBtn) upBtn.disabled = index === 0;
  if (downBtn) downBtn.disabled = index === state.components.length - 1;

  const fields = el.querySelector('.comp-fields');
  if (fields && el._lastType !== comp.type) {
    el._lastType = comp.type;
    fields.innerHTML = '';
    switch (comp.type) {
      case 'text':
        fields.appendChild(createTextarea('文本', comp, 'text'));
        break;
      case 'selector':
        fields.appendChild(createField('选择器', comp, 'selector', 'text', '@p'));
        break;
      case 'score': {
        const group = document.createElement('div');
        group.className = 'comp-field-group';
        group.appendChild(createField('目标', comp, 'scoreName', 'text'));
        group.appendChild(createField('记分项', comp, 'scoreObjective', 'text'));
        fields.appendChild(group);
        break;
      }
      case 'translate':
        fields.appendChild(createField('翻译键', comp, 'translate', 'text'));
        fields.appendChild(createField('参数（逗号分隔）', comp, 'with', 'text'));
        break;
    }
  }
}

function createComponentElement(comp, index) {
  const card = document.createElement('div');
  card.className = 'component-card';
  card.dataset.id = comp.id;

  const header = document.createElement('div');
  header.className = 'comp-header';

  const select = document.createElement('select');
  select.className = 'comp-type-select';
  ['text', 'selector', 'score', 'translate'].forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    if (t === comp.type) opt.selected = true;
    select.appendChild(opt);
  });
  select.addEventListener('change', () => {
    pushUndo();
    comp.type = select.value;
    renderComponents();
    saveState();
  });

  const arrows = document.createElement('div');
  arrows.className = 'comp-arrows';

  const upBtn = document.createElement('button');
  upBtn.className = 'comp-arrow';
  upBtn.textContent = '↑';
  upBtn.title = '上移';
  upBtn.disabled = index === 0;
  upBtn.addEventListener('click', () => { pushUndo(); moveComponent(index, -1); });

  const downBtn = document.createElement('button');
  downBtn.className = 'comp-arrow';
  downBtn.textContent = '↓';
  downBtn.title = '下移';
  downBtn.disabled = index === state.components.length - 1;
  downBtn.addEventListener('click', () => { pushUndo(); moveComponent(index, 1); });

  arrows.appendChild(upBtn);
  arrows.appendChild(downBtn);

  const delBtn = document.createElement('button');
  delBtn.className = 'comp-delete';
  delBtn.textContent = '✕';
  delBtn.addEventListener('click', () => {
    pushUndo();
    state.components.splice(index, 1);
    renderComponents();
    saveState();
  });

  const rightGroup = document.createElement('div');
  rightGroup.style.display = 'flex';
  rightGroup.style.alignItems = 'center';
  rightGroup.style.gap = '2px';
  rightGroup.appendChild(arrows);
  rightGroup.appendChild(delBtn);

  header.appendChild(select);
  header.appendChild(rightGroup);
  card.appendChild(header);

  const fields = document.createElement('div');
  fields.className = 'comp-fields';

  switch (comp.type) {
    case 'text':
      fields.appendChild(createTextarea('文本', comp, 'text'));
      break;
    case 'selector':
      fields.appendChild(createField('选择器', comp, 'selector', 'text', '@p'));
      break;
    case 'score': {
      const group = document.createElement('div');
      group.className = 'comp-field-group';
      group.appendChild(createField('目标', comp, 'scoreName', 'text'));
      group.appendChild(createField('记分项', comp, 'scoreObjective', 'text'));
      fields.appendChild(group);
      break;
    }
    case 'translate':
      fields.appendChild(createField('翻译键', comp, 'translate', 'text'));
      fields.appendChild(createField('参数（逗号分隔）', comp, 'with', 'text'));
      break;
  }

  card.appendChild(fields);
  return card;
}

function moveComponent(index, dir) {
  const target = index + dir;
  if (target < 0 || target >= state.components.length) return;
  [state.components[index], state.components[target]] = [state.components[target], state.components[index]];
  renderComponents();
  saveState();
}

const debouncedFieldUpdate = debounce(() => { updateAll(); saveState(); }, 150);

function createField(labelText, comp, prop, type, placeholder) {
  const wrapper = document.createElement('div');
  wrapper.className = 'field';
  const label = document.createElement('label');
  label.textContent = labelText;
  const input = document.createElement('input');
  input.type = type;
  input.value = comp[prop] || '';
  input.placeholder = placeholder || '';
  input.spellcheck = false;
  input.addEventListener('input', () => {
    comp[prop] = input.value;
    debouncedFieldUpdate();
  });
  wrapper.appendChild(label);
  wrapper.appendChild(input);
  return wrapper;
}

function createTextarea(labelText, comp, prop) {
  const wrapper = document.createElement('div');
  wrapper.className = 'field';
  const label = document.createElement('label');
  label.textContent = labelText;
  const ta = document.createElement('textarea');
  ta.value = comp[prop] || '';
  ta.spellcheck = false;
  ta.placeholder = '支持 § 颜色代码 和 \\n 换行';
  ta.addEventListener('input', () => {
    comp[prop] = ta.value;
    debouncedFieldUpdate();
  });
  wrapper.appendChild(label);
  wrapper.appendChild(ta);
  return wrapper;
}

// ─── Command Generation ───

function generateCommand() {
  const rawtext = state.components.map(comp => {
    const obj = {};
    switch (comp.type) {
      case 'text':
        if (!comp.text) return null;
        obj.text = comp.text;
        break;
      case 'selector':
        if (!comp.selector) return null;
        obj.selector = comp.selector;
        break;
      case 'score':
        if (!comp.scoreName && !comp.scoreObjective) return null;
        obj.score = {};
        if (comp.scoreName) obj.score.name = comp.scoreName;
        if (comp.scoreObjective) obj.score.objective = comp.scoreObjective;
        break;
      case 'translate':
        if (!comp.translate) return null;
        obj.translate = comp.translate;
        if (comp.with) {
          obj.with = comp.with.split(',').map(s => s.trim()).filter(Boolean);
        }
        break;
    }
    return obj;
  }).filter(Boolean);

  const json = cmdMode === 'format'
    ? JSON.stringify({ rawtext }, null, 2)
    : JSON.stringify({ rawtext });

  return `/titleraw ${state.player} ${state.type} ${json}`;
}

function updateCommandPreview() {
  commandPreview.textContent = generateCommand();
}

// ─── Visual Preview with § and \n parsing ───

function parseFormattedText(raw) {
  if (!raw) return null;

  const parts = [];
  let i = 0, styles = [];

  function span(text, st) {
    if (!text) return '';
    const rules = [];
    let obfuscated = false;
    for (const s of st) {
      if (s === 'bold') rules.push('font-weight:700');
      else if (s === 'italic') rules.push('font-style:italic');
      else if (s === 'obfuscated') obfuscated = true;
      else if (s.startsWith('color:')) rules.push('color:' + s.slice(6));
    }
    if (obfuscated) text = obfuscateText(text);
    return rules.length ? '<span style="' + rules.join(';') + '">' + text + '</span>' : text;
  }

  let buf = '';
  while (i < raw.length) {
    if (raw[i] === '§' && i + 1 < raw.length) {
      if (buf) { parts.push(span(buf, styles)); buf = ''; }
      const code = raw[i + 1].toLowerCase();
      i += 2;
      if (FORMAT_MAP[code] === 'reset') { styles = []; }
      else if (FORMAT_MAP[code] === 'bold') { styles = [...styles.filter(s => s !== 'bold'), 'bold']; }
      else if (FORMAT_MAP[code] === 'italic') { styles = [...styles.filter(s => s !== 'italic'), 'italic']; }
      else if (FORMAT_MAP[code] === 'obfuscated') { styles = [...styles.filter(s => s !== 'obfuscated'), 'obfuscated']; }
      else {
        const color = FORMAT_COLORS.get(code);
        if (color) { styles = styles.filter(s => !s.startsWith('color:')); styles.push('color:' + color.hex); }
        else { buf += '§' + raw[i - 1]; }
      }
    } else if (raw[i] === '\\' && raw[i + 1] === 'n') {
      if (buf) { parts.push(span(buf, styles)); buf = ''; }
      parts.push('<br>');
      i += 2;
    } else if (raw[i] === '\n') {
      if (buf) { parts.push(span(buf, styles)); buf = ''; }
      parts.push('<br>');
      i++;
    } else {
      buf += raw[i];
      i++;
    }
  }
  if (buf) parts.push(span(buf, styles));
  return parts.join('');
}

function obfuscateText(text) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  return text.split('').map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function buildPreviewHTML() {
  let html = '';
  state.components.forEach(comp => {
    switch (comp.type) {
      case 'text': {
        const t = comp.text || '';
        if (!t) return;
        const parsed = parseFormattedText(t);
        if (parsed) html += parsed;
        break;
      }
      case 'selector': {
        if (!comp.selector) return;
        html += '<span style="color:#aaaaaa">[target]</span>';
        break;
      }
      case 'score': {
        if (!comp.scoreName && !comp.scoreObjective) return;
        html += '<span style="color:#aaaaaa">[0]</span>';
        break;
      }
      case 'translate': {
        const t = comp.translate || '';
        if (!t) return;
        const parsed = parseFormattedText(t);
        if (parsed) html += parsed;
        break;
      }
    }
  });
  return html || '<span style="opacity:0.35">（空）</span>';
}

function updateVisualPreview() {
  const html = buildPreviewHTML();
  vTitle.innerHTML = '';
  vSubtitle.innerHTML = '';
  vActionbar.innerHTML = '';
  if (state.type === 'title') vTitle.innerHTML = html;
  else if (state.type === 'subtitle') vSubtitle.innerHTML = html;
  else if (state.type === 'actionbar') vActionbar.innerHTML = html;
}

function updateAll() {
  updateCommandPreview();
  updateVisualPreview();
}

// ─── Segmented Indicator ───

function updateIndicator(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const indicator = container.querySelector('.seg-indicator');
  const active = container.querySelector('.active');
  if (!indicator || !active) return;
  indicator.style.width = active.offsetWidth + 'px';
  indicator.style.transform = `translateX(${active.offsetLeft}px)`;
}

// ─── Events ───

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

addBtn.addEventListener('click', () => {
  pushUndo();
  state.components.push({
    id: generateId(), type: 'text', text: '', selector: '@p',
    scoreName: '', scoreObjective: '', translate: '', with: '',
  });
  renderComponents();
  saveState();
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

// ─── Toast ───

function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 1800);
}

// ─── Modal ───

function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

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

// ─── Init ───

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
