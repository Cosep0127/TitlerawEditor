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
