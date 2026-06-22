import { COLOR_TO_CODE } from './constants.js';
import { generateId } from './utils.js';
import { importInput, importError, playerInput, typeSelector } from './dom.js';
import { state, pushUndo, saveState } from './state.js';
import { renderComponents } from './components.js';
import { showToast, closeModal, updateIndicator } from './ui.js';

export function parseImport(text) {
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
      if (item.with && typeof item.with === 'object' && !Array.isArray(item.with) && item.with.rawtext) {
        comp.withType = 'object';
        comp.withComponents = parseRawtextItems(item.with.rawtext);
        comp.with = '';
      } else if (item.with && Array.isArray(item.with)) {
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

function parseRawtextItems(arr) {
  return arr.map(item => {
    const c = {
      id: generateId(), type: 'text', text: '',
      selector: '@p', scoreName: '', scoreObjective: '',
      translate: '', with: '', withType: 'list', withComponents: [],
    };
    if (item.text !== undefined) {
      c.type = 'text';
      let prefix = '';
      if (item.color && COLOR_TO_CODE[item.color]) prefix += '§' + COLOR_TO_CODE[item.color];
      if (item.bold) prefix += '§l';
      if (item.italic) prefix += '§o';
      if (item.obfuscated) prefix += '§k';
      c.text = prefix + (item.text || '');
    } else if (item.selector !== undefined) {
      c.type = 'selector';
      c.selector = item.selector;
    } else if (item.score !== undefined) {
      c.type = 'score';
      c.scoreName = (item.score && item.score.name) || '';
      c.scoreObjective = (item.score && item.score.objective) || '';
    } else if (item.translate !== undefined) {
      c.type = 'translate';
      c.translate = item.translate || '';
      if (item.with && typeof item.with === 'object' && !Array.isArray(item.with) && item.with.rawtext) {
        c.withType = 'object';
        c.withComponents = parseRawtextItems(item.with.rawtext);
      } else if (item.with && Array.isArray(item.with)) {
        c.with = item.with.join(', ');
      } else if (item.with) {
        c.with = String(item.with);
      }
    } else {
      c.text = JSON.stringify(item);
    }
    return c;
  });
}

export function doImport() {
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
    state.components = result.components.length ? result.components : [{ id: generateId(), type: 'text', text: '', selector: '@p', scoreName: '', scoreObjective: '', translate: '', with: '', withType: 'list', withComponents: [] }];
    importError.textContent = '';
    renderComponents();
    showToast('导入成功');
    saveState();
    closeModal('importModal');
  } catch (e) {
    importError.textContent = e.message;
  }
}
