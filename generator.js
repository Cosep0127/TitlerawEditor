import { state, cmdMode } from './state.js';
import { commandPreview } from './dom.js';

function serializeJson(obj, indent, level) {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'string') {
    return '"' + obj.replace(/"/g, '\\"') + '"';
  }
  if (typeof obj === 'number') return String(obj);
  const nl = indent ? '\n' + indent.repeat(level) : '';
  const nlInner = indent ? '\n' + indent.repeat(level + 1) : '';
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return '[' + nlInner + obj.map(v => serializeJson(v, indent, level + 1)).join(',' + nlInner) + nl + ']';
  }
  if (typeof obj === 'object') {
    const pairs = Object.entries(obj);
    if (pairs.length === 0) return '{}';
    return '{' + nlInner + pairs.map(([k, v]) => '"' + k + '":' + (indent ? ' ' : '') + serializeJson(v, indent, level + 1)).join(',' + nlInner) + nl + '}';
  }
  return 'null';
}

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
    ? serializeJson({ rawtext }, '  ', 0)
    : serializeJson({ rawtext });

  return `/titleraw ${state.player} ${state.type} ${json}`;
}

export function updateCommandPreview() {
  commandPreview.textContent = generateCommand();
}
