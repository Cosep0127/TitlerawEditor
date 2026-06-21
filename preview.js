import { FORMAT_MAP, FORMAT_COLORS } from './constants.js';
import { state } from './state.js';
import { vTitle, vSubtitle, vActionbar } from './dom.js';
import { updateCommandPreview } from './generator.js';

export function parseFormattedText(raw) {
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

export function updateAll() {
  updateCommandPreview();
  updateVisualPreview();
}
