// Adapted from https://gist.github.com/ORESoftware/ba5d03f3e1826dc15d5ad2bcec37f7bf
export function resizeImage(file, callback = () => {}) {
  const reader = new FileReader();
  reader.onload = function (e) {
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
  reader.onerror = function (e) {
    if (process.env.NODE_ENV !== 'production') console.error(e);
    callback(null);
  };
  reader.readAsDataURL(file);
}
