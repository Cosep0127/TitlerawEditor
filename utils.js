export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function debounce(fn, ms) {
  let t;
  return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
}
