/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
 export function upload (state, ins = () => {}) {
  if (!confirm("Inserting images increases your wiki's file size. Continue?")) return;
  FW.upload('image/*', file => {
    resizeImage(file, (img, w, h) => {
      if (img) {
        const id = FW.hash.string(img);
        state.p.img[id.toString()] = {
          alt: prompt('Alt text:', file.name),
          size: [w, h],
          img,
        };
        ins({ img, id });
      }
    });
  });
}

// Given form event `e` and stored image data `i` do `ins()`
export function put (e, i, ins = () => {}) {
  e.preventDefault();
  document.getElementById('g').close();
  ins(i);
}

// Truncate image using its stored ID instead
export function abbr (content) {
  return content.replace(/(?:<img src=")[^"]+#([-\d]+)(?=")/g, '<img src="img:$1:img');
}

// Restore image HTML after using it stored mangling (or mangle it with not)
export function fix (content, not) {
  if (not) return content.replace(/<img /g, '<im ');
  return content.replace(/<im /g, '<img ');
}

// Adapted from https://gist.github.com/ORESoftware/ba5d03f3e1826dc15d5ad2bcec37f7bf
export function resizeImage(file, callback = () => {}) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.src = e.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      let maxWidth = prompt('Max width pixels:', '400');
      maxWidth = maxWidth?.length ? parseInt(maxWidth) : 400;
      let maxHeight = prompt('Max height pixels:', '350');
      maxHeight = maxHeight?.length ? parseInt(maxHeight) : 350;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL(file.type), width, height);
    };
  };
  reader.onerror = e => {
    if (process.env.NODE_ENV !== 'production') console.error(e);
    callback(null);
  };
  reader.readAsDataURL(file);
}
