export const slugify = s => s.toLowerCase().replace(/\s/g, '_').replace(/\W/g, '-');

export const formatDate = d => {
  const pad = s => s.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${d.getHours() % 12}:${pad(d.getMinutes())} ${d.getHours() / 12 < 1 ? 'a' : 'p'}m`;
};

export const tidyArray = ar => { // For arrays of strings (like tags) only
  const a = ar.map(v => v.trim());
  return a.filter((v, i) => v.length && a.indexOf(v) === i).sort();
};
