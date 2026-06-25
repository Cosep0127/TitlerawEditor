import { FORMAT_COLORS, STANDARD_CODES, MATERIAL_CODES, OTHER_CODES } from './constants.js';
import { state, editingIndex, insertAfterIndex, setEditingIndex, setInsertAfterIndex, withComponents, withNestingLevel, setWithComponents, setWithNestingLevel } from './state.js';
import { refColorGrid, refMaterialGrid, refOtherGrid, refFormatRow } from './dom.js';
import { generateId } from './utils.js';

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
  indicator.style.width = (active.offsetWidth - 1) + 'px';
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
  indicator.style.width = (active.offsetWidth - 1) + 'px';
  indicator.style.transform = `translateX(${active.offsetLeft}px)`;
}

export function updateAddFields(type, comp) {
  buildFields('add', type, comp, 0);
}

export function buildFields(prefix, type, comp, nestingLevel) {
  const suffix = nestingLevel === 0 ? '' : '_' + nestingLevel;
  const containerId = prefix + 'CompFields' + suffix;
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  switch (type) {
    case 'text': {
      const label = document.createElement('div');
      label.className = 'modal-field-label';
      label.textContent = '文本';
      const ta = document.createElement('textarea');
      ta.id = prefix + 'CompText' + suffix;
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
      inp.id = prefix + 'CompSelector' + suffix;
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
      ni.id = prefix + 'CompScoreName' + suffix;
      ni.type = 'text';
      ni.value = comp ? comp.scoreName || '' : '';
      n.appendChild(nl); n.appendChild(ni);
      const o = document.createElement('div');
      o.className = 'field';
      const ol = document.createElement('label');
      ol.textContent = '记分项';
      const oi = document.createElement('input');
      oi.id = prefix + 'CompScoreObjective' + suffix;
      oi.type = 'text';
      oi.value = comp ? comp.scoreObjective || '' : '';
      o.appendChild(ol); o.appendChild(oi);
      g.appendChild(n); g.appendChild(o);
      container.appendChild(g);
      break;
    }
    case 'translate': {
      const pfx = prefix;
      const withType = comp ? comp.withType || 'list' : 'list';

      if (pfx === 'add') {
        // Initialize global withComponents for the top-level translate
        setWithComponents(withType === 'object' && comp ? comp.withComponents.map(c => ({ ...c })) : []);
        setWithNestingLevel(0);
      }

      const keyLabel = document.createElement('div');
      keyLabel.className = 'modal-field-label';
      keyLabel.textContent = '键名';
      const keyInput = document.createElement('input');
      keyInput.id = pfx + 'CompTranslate' + suffix;
      keyInput.type = 'text';
      keyInput.value = comp ? comp.translate || '' : '';
      keyInput.placeholder = '翻译键';
      container.appendChild(keyLabel);
      container.appendChild(keyInput);

      const withHeader = document.createElement('div');
      withHeader.className = 'with-header';
      const withLabel = document.createElement('div');
      withLabel.className = 'modal-field-label';
      withLabel.textContent = 'WITH';
      withLabel.style.marginBottom = '0';
      const withSeg = document.createElement('div');
      withSeg.className = 'with-type-seg';
      const withIndicator = document.createElement('div');
      withIndicator.className = 'seg-indicator';
      const btnList = document.createElement('button');
      btnList.type = 'button';
      btnList.className = 'with-type-btn';
      btnList.textContent = '[…]';
      btnList.dataset.withType = 'list';
      const btnObj = document.createElement('button');
      btnObj.type = 'button';
      btnObj.className = 'with-type-btn';
      btnObj.textContent = '{…}';
      btnObj.dataset.withType = 'object';
      if (nestingLevel >= 2) btnObj.disabled = true;
      withSeg.appendChild(withIndicator);
      withSeg.appendChild(btnList);
      withSeg.appendChild(btnObj);
      withHeader.appendChild(withLabel);
      withHeader.appendChild(withSeg);
      container.appendChild(withHeader);

      function positionWithIndicator(btn) {
        withIndicator.style.width = (btn.offsetWidth - 1) + 'px';
        withIndicator.style.transform = 'translateX(' + btn.offsetLeft + 'px)';
      }

      const contentArea = document.createElement('div');
      contentArea.className = 'with-params-area';
      container.appendChild(contentArea);

      const hiddenWithType = document.createElement('input');
      hiddenWithType.id = pfx + 'CompWithType' + suffix;
      hiddenWithType.type = 'hidden';
      hiddenWithType.value = withType;
      container.appendChild(hiddenWithType);

      const hiddenWith = document.createElement('input');
      hiddenWith.id = pfx + 'CompWith' + suffix;
      hiddenWith.type = 'hidden';
      hiddenWith.value = withType === 'list' ? (comp ? comp.with || '' : '') : '';
      container.appendChild(hiddenWith);

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'chip with-param-add-chip';
      container.appendChild(addBtn);

      let listParams = [];
      if (withType === 'list') {
        listParams = hiddenWith.value ? hiddenWith.value.split(',').map(s => s.trim()).filter(Boolean) : [];
      }

      function renderListItems(focusNew) {
        contentArea.innerHTML = '';
        if (listParams.length === 0) {
          const empty = document.createElement('div');
          empty.className = 'with-params-empty';
          empty.textContent = '无参数';
          contentArea.appendChild(empty);
        } else {
          listParams.forEach((p, i) => {
            const item = document.createElement('div');
            item.className = 'with-param-item';
            const inp = document.createElement('input');
            inp.type = 'text';
            inp.className = 'with-param-inline-input';
            inp.value = p || '';
            inp.placeholder = '输入参数';
            inp.addEventListener('keydown', e => {
              if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
              if (e.key === 'Escape') { inp.value = p || ''; inp.blur(); }
            });
            inp.addEventListener('blur', () => {
              const val = inp.value.trim();
              if (val) { listParams[i] = val; } else { listParams.splice(i, 1); }
              syncList();
            });
            item.appendChild(inp);
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'with-param-remove';
            removeBtn.textContent = '✕';
            removeBtn.addEventListener('click', () => {
              listParams.splice(i, 1);
              syncList();
            });
            item.appendChild(removeBtn);
            contentArea.appendChild(item);
          });
        }
        if (focusNew) {
          const inputs = contentArea.querySelectorAll('.with-param-inline-input');
          const last = inputs[inputs.length - 1];
          if (last && !last.value) setTimeout(() => last.focus(), 0);
        }
      }

      function syncList() {
        hiddenWith.value = listParams.filter(Boolean).join(', ');
        renderListItems();
      }



      function renderObjectItems() {
        const comps = (pfx === 'add') ? withComponents : (comp ? comp.withComponents || [] : []);
        contentArea.innerHTML = '';
        if (comps.length === 0) {
          const empty = document.createElement('div');
          empty.className = 'with-params-empty';
          empty.textContent = '无组件';
          contentArea.appendChild(empty);
        } else {
          comps.forEach((c, i) => {
            const item = document.createElement('div');
            item.className = 'with-component-item';
            const typeSpan = document.createElement('span');
            typeSpan.className = 'with-comp-type';
            typeSpan.textContent = c.type;
            const textSpan = document.createElement('span');
            textSpan.className = 'with-comp-text';
            textSpan.textContent = getCompShortPreview(c);
            const actions = document.createElement('div');
            actions.className = 'with-comp-actions';
            const upBtn = document.createElement('button');
            upBtn.className = 'with-comp-btn';
            upBtn.textContent = '↑';
            upBtn.title = '上移';
            upBtn.disabled = i === 0;
            upBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              [comps[i - 1], comps[i]] = [comps[i], comps[i - 1]];
              renderObjectItems();
            });
            const downBtn = document.createElement('button');
            downBtn.className = 'with-comp-btn';
            downBtn.textContent = '↓';
            downBtn.title = '下移';
            downBtn.disabled = i === comps.length - 1;
            downBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              [comps[i], comps[i + 1]] = [comps[i + 1], comps[i]];
              renderObjectItems();
            });
            const addBtn = document.createElement('button');
            addBtn.className = 'with-comp-btn';
            addBtn.textContent = '+';
            addBtn.title = '在此下方添加组件';
            addBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              createWithModal(comps, -1, nestingLevel + 1, prefix, 'text', i + 1);
            });
            const removeBtn = document.createElement('button');
            removeBtn.className = 'with-comp-btn';
            removeBtn.textContent = '✕';
            removeBtn.title = '删除';
            removeBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              comps.splice(i, 1);
              renderObjectItems();
            });
            actions.appendChild(upBtn);
            actions.appendChild(downBtn);
            actions.appendChild(addBtn);
            actions.appendChild(removeBtn);
            item.appendChild(typeSpan);
            item.appendChild(textSpan);
            item.appendChild(actions);
            item.addEventListener('click', () => {
              createWithModal(comps, i, nestingLevel + 1, prefix, c.type);
            });
            contentArea.appendChild(item);
          });
        }
      }

      function updateMode(mode) {
        hiddenWithType.value = mode;
        if (mode === 'object') {
          addBtn.textContent = '添加组件';
          renderObjectItems();
        } else {
          addBtn.textContent = '添加参数';
          listParams = hiddenWith.value ? hiddenWith.value.split(',').map(s => s.trim()).filter(Boolean) : [];
          renderListItems();
        }
      }

      addBtn.addEventListener('click', () => {
        if (hiddenWithType.value === 'object') {
          createWithModal(
            (prefix === 'add') ? withComponents : (comp ? comp.withComponents || [] : []),
            -1, nestingLevel + 1, prefix, 'text'
          );
        } else {
          listParams.push('');
          renderListItems(true);
        }
      });

      [btnList, btnObj].forEach((btn, idx) => {
        btn.addEventListener('click', () => {
          btnList.classList.remove('active');
          btnObj.classList.remove('active');
          btn.classList.add('active');
          positionWithIndicator(btn);
          updateMode(btn.dataset.withType);
        });
      });

      // Set initial active state
      if (withType === 'list') {
        btnList.classList.add('active');
      } else {
        btnObj.classList.add('active');
      }
      requestAnimationFrame(() => {
        const active = btnList.classList.contains('active') ? btnList : btnObj;
        positionWithIndicator(active);
        updateMode(active.dataset.withType);
      });
      break;
    }
  }
}

function getCompShortPreview(c) {
  switch (c.type) {
    case 'text': return (c.text || '').split('\n')[0];
    case 'selector': return c.selector || '';
    case 'score': return (c.scoreName || '?') + ' / ' + (c.scoreObjective || '?');
    case 'translate': return c.translate || '';
    default: return '';
  }
}

function withModalSaveHandler(modal, comps) {
  const s = modal.id.replace('withModal_', '');
  const prefix = 'with';
  const suffix = '_' + s;
  const active = modal.querySelector('.add-comp-type-group .active');
  const type = active ? active.dataset.type : 'text';
  const comp = {
    id: generateId(),
    type, text: '', selector: '@p',
    scoreName: '', scoreObjective: '', translate: '', with: '',
    withType: 'list', withComponents: [],
  };
  switch (type) {
    case 'text': comp.text = (document.getElementById(prefix + 'CompText' + suffix)?.value || ''); break;
    case 'selector': comp.selector = (document.getElementById(prefix + 'CompSelector' + suffix)?.value || '@p'); break;
    case 'score': comp.scoreName = (document.getElementById(prefix + 'CompScoreName' + suffix)?.value || ''); comp.scoreObjective = (document.getElementById(prefix + 'CompScoreObjective' + suffix)?.value || ''); break;
    case 'translate': {
      comp.translate = (document.getElementById(prefix + 'CompTranslate' + suffix)?.value || '');
      const wt = document.getElementById(prefix + 'CompWithType' + suffix);
      if (wt) {
        comp.withType = wt.value;
        if (comp.withType === 'object') {
          comp.withComponents = withComponents.map(c => ({ ...c }));
          comp.with = '';
        } else {
          comp.with = (document.getElementById(prefix + 'CompWith' + suffix)?.value || '');
          comp.withComponents = [];
        }
      }
      break;
    }
  }
  const editIndex = parseInt(modal.dataset.editIndex, 10);
  const insertAfter = modal.dataset.insertAfter;
  if (editIndex >= 0) {
    comps[editIndex] = comp;
  } else if (insertAfter) {
    comps.splice(parseInt(insertAfter, 10), 0, comp);
  } else {
    comps.push(comp);
  }
  modal.classList.remove('open');
  setTimeout(() => modal.remove(), 200);
  // Re-render parent WITH area
  const parentPrefix = modal.dataset.parentPrefix || 'add';
  const parentNesting = parseInt(modal.dataset.parentNesting, 10);
  const parentSuffix = parentNesting === 0 ? '' : '_' + parentNesting;
  const parentContainer = document.getElementById(parentPrefix + 'CompFields' + parentSuffix);
  const translateInput = parentContainer && parentContainer.querySelector('#' + parentPrefix + 'CompTranslate' + parentSuffix);
  if (translateInput) {
    const parentTypeInput = document.getElementById(parentPrefix + 'CompWithType' + parentSuffix);
    const parentComp = { translate: translateInput.value, withType: parentTypeInput ? parentTypeInput.value : 'list' };
    if (parentComp.withType === 'object') {
      parentComp.withComponents = comps;
    }
    buildFields(parentPrefix, 'translate', parentComp, parentNesting);
  }
}

function createWithModal(comps, index, nestingLevel, parentPrefix, typeHint, insertAfter) {
  setWithComponents(comps);
  setWithNestingLevel(nestingLevel);
  const s = '_' + nestingLevel;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'withModal_' + nestingLevel;
  modal.dataset.editIndex = String(index);
  if (insertAfter != null) modal.dataset.insertAfter = String(insertAfter);
  modal.dataset.parentPrefix = parentPrefix || 'add';
  modal.dataset.parentNesting = String(nestingLevel - 1);

  const title = index >= 0 ? '编辑WITH中的组件' : '添加WITH中的组件';
  const confirmText = index >= 0 ? '保存' : '添加';
  const comp = index >= 0 ? comps[index] : null;

  modal.innerHTML =
    '<div class="modal">' +
      '<div class="modal-header">' +
        '<h2>' + title + '</h2>' +
        '<button class="modal-close">✕</button>' +
      '</div>' +
      '<div class="modal-body">' +
        '<div class="add-comp-row">' +
          '<div class="modal-field-label">类型</div>' +
          '<div class="add-comp-type-group" id="withCompTypeGroup' + s + '">' +
            '<div class="seg-indicator"></div>' +
            '<button class="add-comp-type-btn active" data-type="text">text</button>' +
            '<button class="add-comp-type-btn" data-type="selector">selector</button>' +
            '<button class="add-comp-type-btn" data-type="score">score</button>' +
            '<button class="add-comp-type-btn" data-type="translate">translate</button>' +
          '</div>' +
        '</div>' +
        '<div id="withCompFields' + s + '" class="add-comp-fields"></div>' +
      '</div>' +
      '<div class="modal-footer">' +
        '<button class="modal-confirm">' + confirmText + '</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(modal);

  const typeGroup = document.getElementById('withCompTypeGroup' + s);
  const indicator = typeGroup.querySelector('.seg-indicator');

  function positionIndicator(btn) {
    indicator.style.width = (btn.offsetWidth - 1) + 'px';
    indicator.style.transform = 'translateX(' + (btn.offsetLeft || 0) + 'px)';
  }

  if (comp) {
    typeGroup.querySelectorAll('.add-comp-type-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.type === comp.type);
    });
  }

  typeGroup.querySelectorAll('.add-comp-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      typeGroup.querySelectorAll('.add-comp-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      buildFields('with', btn.dataset.type, null, nestingLevel);
      requestAnimationFrame(() => positionIndicator(btn));
    });
  });

  buildFields('with', comp ? comp.type : (typeHint || 'text'), comp, nestingLevel);
  requestAnimationFrame(() => {
    const active = typeGroup.querySelector('.active');
    if (active) positionIndicator(active);
  });

  modal.querySelector('.modal-close').addEventListener('click', () => {
    modal.classList.remove('open');
    setTimeout(() => modal.remove(), 200);
  });

  modal.querySelector('.modal-confirm').addEventListener('click', () => {
    withModalSaveHandler(modal, comps);
  });

  requestAnimationFrame(() => modal.classList.add('open'));
}
