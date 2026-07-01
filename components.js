import { state, pushUndo, saveState } from './state.js';
import { componentsList } from './dom.js';
import { openEditModal, openAddAfterModal } from './ui.js';
import { updateAll } from './preview.js';

function getPreviewText(comp) {
  switch (comp.type) {
    case 'text':
      if (!comp.text) return '';
      const first = comp.text.split('\n')[0];
      return first.length < comp.text.length ? first + '…' : first;
    case 'selector':
      return comp.selector || '';
    case 'score':
      return (comp.scoreName || '?') + ' / ' + (comp.scoreObjective || '?');
    case 'translate':
      const n = comp.with ? comp.with.split(',').filter(s => s.trim()).length : 0;
      const m = comp.withType === 'object' ? (comp.withComponents ? comp.withComponents.length : 0) : 0;
      const count = comp.withType === 'object' ? m : n;
      const bracket = comp.withType === 'object' ? '{' : '[';
      const closeBracket = comp.withType === 'object' ? '}' : ']';
      return (comp.translate || '') + (count > 0 ? ' ' + bracket + count + closeBracket : '');
    default:
      return '';
  }
}

export function renderComponents() {
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
  const badge = el.querySelector('.comp-badge');
  if (badge) badge.textContent = `#${index + 1}`;
  const typeLabel = el.querySelector('.comp-type-label');
  if (typeLabel) typeLabel.textContent = comp.type;
  const textEl = el.querySelector('.comp-text');
  if (textEl) textEl.textContent = getPreviewText(comp);
  el.dataset.index = index;
  const arrows = el.querySelectorAll('.comp-arrow');
  if (arrows.length >= 2) {
    arrows[0].disabled = index === 0;
    arrows[1].disabled = index === state.components.length - 1;
  }
}

function createComponentElement(comp, index) {
  const card = document.createElement('div');
  card.className = 'component-card';
  card.dataset.id = comp.id;
  card.dataset.index = index;

  const badge = document.createElement('span');
  badge.className = 'comp-badge';
  badge.textContent = `#${index + 1}`;

  const typeLabel = document.createElement('span');
  typeLabel.className = 'comp-type-label';
  typeLabel.textContent = comp.type;

  card.appendChild(badge);
  card.appendChild(typeLabel);

  const textEl = document.createElement('span');
  textEl.className = 'comp-text';
  textEl.textContent = getPreviewText(comp);
  card.appendChild(textEl);

  const right = document.createElement('div');
  right.className = 'comp-right';

  const upBtn = document.createElement('button');
  upBtn.className = 'comp-arrow';
  upBtn.textContent = '↑';
  upBtn.title = '上移';
  upBtn.disabled = index === 0;
  upBtn.addEventListener('click', (e) => { e.stopPropagation(); pushUndo(); moveComponent(+card.dataset.index, -1); });

  const downBtn = document.createElement('button');
  downBtn.className = 'comp-arrow';
  downBtn.textContent = '↓';
  downBtn.title = '下移';
  downBtn.disabled = index === state.components.length - 1;
  downBtn.addEventListener('click', (e) => { e.stopPropagation(); pushUndo(); moveComponent(+card.dataset.index, 1); });

  const addHereBtn = document.createElement('button');
  addHereBtn.className = 'comp-add';
  addHereBtn.textContent = '+';
  addHereBtn.title = '在此下方添加组件';
  addHereBtn.addEventListener('click', (e) => { e.stopPropagation(); openAddAfterModal(+card.dataset.index); });

  const delBtn = document.createElement('button');
  delBtn.className = 'comp-delete';
  delBtn.textContent = '✕';
  delBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    pushUndo();
    state.components.splice(+card.dataset.index, 1);
    renderComponents();
    saveState();
  });

  right.appendChild(upBtn);
  right.appendChild(downBtn);
  right.appendChild(addHereBtn);
  right.appendChild(delBtn);
  card.appendChild(right);
  card.addEventListener('click', () => openEditModal(+card.dataset.index));
  return card;
}

export function moveComponent(index, dir) {
  const target = index + dir;
  if (target < 0 || target >= state.components.length) return;
  [state.components[index], state.components[target]] = [state.components[target], state.components[index]];
  renderComponents();
  saveState();
}
