import { state, cmdMode } from './state.js';
import { commandPreview } from './dom.js';

export function generateCommand() {
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

export function updateCommandPreview() {
  commandPreview.textContent = generateCommand();
}
