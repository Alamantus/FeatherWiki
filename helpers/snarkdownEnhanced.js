import md from 'snarkdown';

export default function snarkdownEnhanced(markdown) {
  return markdown
    .split(/(?:\r?\n){2,}/)
    .map(l =>
      [" ", "\t", "#", "-", "*", ">"].some(c => l.startsWith(c))
        ? md(l)
        : `<p>${md(l)}</p>`
    )
    .join("\n");
}