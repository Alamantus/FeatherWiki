// Adapted from https://gist.github.com/ORESoftware/ba5d03f3e1826dc15d5ad2bcec37f7bf
export function resizeImage(file, callback = () => {}, maxWidth = 400, maxHeight = 350) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.src = e.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const warning = `Your image will be resized to a maximum of ${maxWidth} pixels wide and ${maxHeight} pixels high to help reduce the file size of the wiki.`;
        if (!window.confirm(warning)) {
          return callback(img.src);
        }
      }

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
      callback(canvas.toDataURL(file.type));
    };
  };
  reader.onerror = function (e) {
    console.error(e);
    callback(null);
  };
  reader.readAsDataURL(file);
}
