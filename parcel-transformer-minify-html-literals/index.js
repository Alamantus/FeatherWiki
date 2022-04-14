const fs = require('fs');
const { Transformer } = require('@parcel/plugin');
const { minifyHTMLLiterals } = require('minify-html-literals');

module.exports = new Transformer({
  async transform({ asset }) {
    const source = await asset.getCode();

    const result = minifyHTMLLiterals(source, {
      fileName: asset.filePath,
      collapseBooleanAttributes: true,
      decodeEntities: true,
      removeAttributeQuotes: true,
      removeComments: true,
      removeEmptyAttributes: true,
      removeEmptyElements: true,
      removeRedundantAttributes: true,
    });

    if (result) {
      asset.setCode(result.code);
    }

    // Return the asset
    return [asset];
  }
});