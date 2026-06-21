import { FORMAT_COLORS, STANDARD_CODES, MATERIAL_CODES, OTHER_CODES } from './constants.js';
import { state, editingIndex, insertAfterIndex, setEditingIndex, setInsertAfterIndex } from './state.js';
import { refColorGrid, refMaterialGrid, refOtherGrid, refFormatRow } from './dom.js';

export function showToast(msg) {
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

export function openModal(id) {
  document.getElementById(id).classList.add('open');
}

export function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

export function updateIndicator(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const indicator = container.querySelector('.seg-indicator');
  const active = container.querySelector('.active');
  if (!indicator || !active) return;
  indicator.style.width = active.offsetWidth + 'px';
  indicator.style.transform = `translateX(${active.offsetLeft}px)`;
}

export function copyCode(code, label) {
  navigator.clipboard.writeText(code).then(() => {
    showToast('已复制 ' + label);
  }).catch(() => showToast('复制失败'));
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

export function buildReferenceCard() {
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

export function openAddModal() {
  setEditingIndex(-1);
  setInsertAfterIndex(-1);
  document.getElementById('addModalTitle').textContent = '添加组件';
  document.getElementById('addModalConfirm').textContent = '添加';
  document.querySelectorAll('#addCompTypeGroup .add-comp-type-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('#addCompTypeGroup .add-comp-type-btn[data-type="text"]').classList.add('active');
  updateAddFields('text');
  updateAddCompIndicator();
  openModal('addModal');
}

export function openEditModal(index) {
  setEditingIndex(index);
  setInsertAfterIndex(-1);
  const comp = state.components[index];
  document.getElementById('addModalTitle').textContent = '编辑组件';
  document.getElementById('addModalConfirm').textContent = '保存';
  document.querySelectorAll('#addCompTypeGroup .add-comp-type-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.type === comp.type);
  });
  updateAddFields(comp.type, comp);
  updateAddCompIndicator();
  openModal('addModal');
}

export function openAddAfterModal(index) {
  setEditingIndex(-1);
  setInsertAfterIndex(index);
  document.getElementById('addModalTitle').textContent = '添加组件';
  document.getElementById('addModalConfirm').textContent = '添加';
  document.querySelectorAll('#addCompTypeGroup .add-comp-type-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('#addCompTypeGroup .add-comp-type-btn[data-type="text"]').classList.add('active');
  updateAddFields('text');
  updateAddCompIndicator();
  openModal('addModal');
}

export function updateAddCompIndicator() {
  const group = document.getElementById('addCompTypeGroup');
  const indicator = group.querySelector('.seg-indicator');
  const active = group.querySelector('.active');
  if (!indicator || !active) return;
  indicator.style.width = active.offsetWidth + 'px';
  indicator.style.transform = `translateX(${active.offsetLeft}px)`;
}

export function updateAddFields(type, comp) {
  const container = document.getElementById('addCompFields');
  container.innerHTML = '';
  switch (type) {
    case 'text': {
      const label = document.createElement('div');
      label.className = 'modal-field-label';
      label.textContent = '文本';
      const ta = document.createElement('textarea');
      ta.id = 'addCompText';
      ta.value = comp ? comp.text || '' : '';
      ta.placeholder = '支持 § 颜色代码 和 \\n 换行';
      ta.rows = 4;
      container.appendChild(label);
      container.appendChild(ta);
      break;
    }
    case 'selector': {
      const label = document.createElement('div');
      label.className = 'modal-field-label';
      label.textContent = '选择器';
      const inp = document.createElement('input');
      inp.id = 'addCompSelector';
      inp.type = 'text';
      inp.value = comp ? comp.selector || '@p' : '@p';
      inp.placeholder = '@p, @a, @r, ...';
      container.appendChild(label);
      container.appendChild(inp);
      break;
    }
    case 'score': {
      const g = document.createElement('div');
      g.className = 'comp-field-group';
      const n = document.createElement('div');
      n.className = 'field';
      const nl = document.createElement('label');
      nl.textContent = '目标';
      const ni = document.createElement('input');
      ni.id = 'addCompScoreName';
      ni.type = 'text';
      ni.value = comp ? comp.scoreName || '' : '';
      n.appendChild(nl); n.appendChild(ni);
      const o = document.createElement('div');
      o.className = 'field';
      const ol = document.createElement('label');
      ol.textContent = '记分项';
      const oi = document.createElement('input');
      oi.id = 'addCompScoreObjective';
      oi.type = 'text';
      oi.value = comp ? comp.scoreObjective || '' : '';
      o.appendChild(ol); o.appendChild(oi);
      g.appendChild(n); g.appendChild(o);
      container.appendChild(g);
      break;
    }
    case 'translate': {
      const t = document.createElement('input');
      t.id = 'addCompTranslate';
      t.type = 'text';
      t.value = comp ? comp.translate || '' : '';
      t.placeholder = '翻译键';
      container.appendChild(t);
      const w = document.createElement('input');
      w.id = 'addCompWith';
      w.type = 'text';
      w.value = comp ? comp.with || '' : '';
      w.placeholder = '参数（逗号分隔）';
      container.appendChild(w);
      break;
    }
  }
}
