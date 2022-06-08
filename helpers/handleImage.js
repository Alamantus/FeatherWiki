export function upload (state, ins = () => {}) {
  if (!confirm('Inserting an image will increase your wiki\'s file size. Continue?')) return;
  FW.upload('image/*', file => {
    resizeImage(file, (img, w, h) => {
      if (img) {
        const id = FW.hash.string(img);
        state.p.img[id.toString()] = {
          alt: prompt('Set alt text', file.name),
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

      let maxWidth = prompt('Set max width pixels:', '400');
      maxWidth = maxWidth?.length ? parseInt(maxWidth) : 400;
      let maxHeight = prompt('Set max height pixels:', '350');
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
