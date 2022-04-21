const fs = require('fs');
const { Transformer } = require('@parcel/plugin');
const packageJson = require('../package.json');

module.exports = new Transformer({
  async transform({ asset }) {
    const source = await asset.getCode();

    const matches = source.match(/(?<={{)package\.json:.+?(?=}})/g);

    if (matches?.length > 0) {
      let result = source;
      matches.map(match => {
        const value = match.replace('package.json:', '').trim();
        const replace = value.split('.').reduce((result, current) => {
          if (result === null) {
            return packageJson[current] ?? '';
          }
          return result[current] ?? '';
        }, null);
        return {
          match: `{{${match}}}`,
          replace,
        };
      }).forEach(m => {
        result = result.replace(m.match, m.replace);
      });

      asset.setCode(result);
    }

    // Return the asset
    return [asset];
  }
});