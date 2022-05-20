import md from 'snarkdown';

export default function snarkdownEnhanced(markdown) {
  const a = '\uFFFF', u = '\uFFFE', l = '\uFFFD', r = '\uFFFC';
  // Find any HTML tags with underscore or asterisk or internal wiki links
  (markdown.match(/<.*?[_*].*?(?=>)|\[\[.+?\]\]/gs) ?? []).forEach(m => {
    markdown = markdown.replace(
      m,
      m.replace(/_/g, u)
        .replace(/\*/g, a)
        .replace(/\[\[/g, l)
        .replace(/\]\]/g, r)
    );
  });
  return markdown.split(/(?:\r?\n){2,}/)
    .map(l =>
      [" ", "\t", "#", "-", "*", ">"].some(c => l.startsWith(c))
        ? md(l)
        : `<p>${md(l)}</p>`
    )
    .join("\n")
    .replace(new RegExp(u, 'g'), '_')
    .replace(new RegExp(a, 'g'), '*')
    .replace(new RegExp(l, 'g'), '[[')
    .replace(new RegExp(r, 'g'), ']]');
}