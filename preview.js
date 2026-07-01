import { FORMAT_MAP, FORMAT_COLORS } from './constants.js';
import { state } from './state.js';
import { vTitle, vSubtitle, vActionbar } from './dom.js';
import { updateCommandPreview } from './generator.js';

export function parseFormattedText(raw, initialStyles) {
  if (!raw) return { html: '', styles: initialStyles || [] };

  const parts = [];
  let i = 0, styles = initialStyles ? [...initialStyles] : [];

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
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
    } else if (raw[i] === '\\' && raw[i + 1] === '\\') {
      buf += '\\';
      i += 2;
    } else if (raw[i] === '\\' && raw[i + 1] === 'n') {
      if (buf) { parts.push(span(buf, styles)); buf = ''; }
      parts.push('<br>');
      i += 2;
    } else if (raw[i] === '\\' && raw[i + 1] === 'u') {
      const hex = raw.slice(i + 2, i + 6);
      if (/^[0-9a-f]{4}$/i.test(hex)) {
        if (buf) { parts.push(span(buf, styles)); buf = ''; }
        buf += String.fromCharCode(parseInt(hex, 16));
        i += 6;
      } else {
        buf += '\\u';
        i += 2;
      }
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
  return { html: parts.join(''), styles };
}

function obfuscateText(text) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  return text.split('').map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function getWithValues(comp) {
  if (comp.withType === 'object') {
    return comp.withComponents ? comp.withComponents.map(c => {
      switch (c.type) {
        case 'text': return c.text || '';
        case 'selector': return '§7[target]';
        case 'score': return '§7[0]';
        case 'translate': return c.translate || '';
        default: return '';
      }
    }).filter(Boolean) : [];
  }
  return comp.with ? comp.with.split(',').map(s => s.trim()).filter(Boolean) : [];
}

function resolveFormatSpecifiers(text, withArr) {
  if (!withArr || withArr.length === 0) return text;
  const sCount = (text.match(/%%s/g) || []).length;
  let sIdx = 0;
  return text.replace(/%%(\d|s)/g, (match, p1) => {
    if (p1 === 's') {
      const val = withArr[sIdx] || '';
      sIdx++;
      return val;
    }
    const pos = parseInt(p1, 10) + sCount;
    if (pos <= 0 || pos > withArr.length) return '';
    return withArr[pos - 1];
  });
}

function buildPreviewHTML() {
  let html = '';
  let prevStyles = [];
  state.components.forEach(comp => {
    switch (comp.type) {
      case 'text': {
        const t = comp.text || '';
        if (!t) return;
        const parsed = parseFormattedText(t, prevStyles);
        if (parsed.html) html += parsed.html;
        prevStyles = parsed.styles;
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
        const withArr = getWithValues(comp);
        if (!withArr || withArr.length === 0) {
          const parsed = parseFormattedText(t, prevStyles);
          if (parsed.html) html += parsed.html;
          prevStyles = parsed.styles;
          break;
        }
        const sCount = (t.match(/%%s/g) || []).length;
        let sIdx = 0;
        let lastIdx = 0;
        let curStyles = prevStyles;
        const parts = [];
        t.replace(/%%(\d|s)/g, (match, p1, offset) => {
          if (offset > lastIdx) {
            const seg = parseFormattedText(t.slice(lastIdx, offset), curStyles);
            parts.push(seg.html);
            curStyles = seg.styles;
          }
          let val;
          if (p1 === 's') {
            val = withArr[sIdx] || '';
            sIdx++;
          } else {
            const pos = parseInt(p1, 10) + sCount;
            val = (pos > 0 && pos <= withArr.length) ? withArr[pos - 1] : '';
          }
          if (val === '§7[target]' || val === '§7[0]') {
            parts.push('<span style="color:#aaaaaa">' + val.slice(2) + '</span>');
          } else if (val) {
            const seg = parseFormattedText(val, curStyles);
            parts.push(seg.html);
            curStyles = seg.styles;
          }
          lastIdx = offset + match.length;
          return match;
        });
        if (lastIdx < t.length) {
          const seg = parseFormattedText(t.slice(lastIdx), curStyles);
          parts.push(seg.html);
          prevStyles = seg.styles;
        } else {
          prevStyles = curStyles;
        }
        html += parts.join('');
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
