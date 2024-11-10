/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
import path from 'path';
import fs from 'fs';
import esbuild from 'esbuild';
import { minifyHTMLLiterals, defaultShouldMinify } from 'minify-html-literals';
import { minify } from 'html-minifier';

// Get the package.json file so data like the version can be used.
const packageJsonFile = fs.readFileSync(path.relative(process.cwd(), 'package.json'), 'utf8');
const packageJson = JSON.parse(packageJsonFile);

const version = packageJson.version.split('.').map((v, i, a) => i === (a.length - 1) ? 'x' : v).join('.');
const buildDir = path.resolve(process.cwd(), `builds`);
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir);
}
const outputDir = path.resolve(buildDir, `v${version}`);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Minify the CSS to insert into the HTML
const cssResult = esbuild.buildSync({
  entryPoints: ['index.css'],
  write: false,
  bundle: true,
  minify: true,
  outdir: 'build',
}).outputFiles[0];
// Output the CSS as an optional download
const cssOutput = new TextDecoder().decode(cssResult.contents);
const cssPath = path.resolve(outputDir, `FeatherWiki-plumage_${packageJson.nickname}.css`);
fs.writeFileSync(cssPath, cssOutput);
const outputCssKb = (Uint8Array.from(Buffer.from(cssOutput)).byteLength * 0.000977).toFixed(3) + ' kilobytes';
console.info(cssPath, outputCssKb);

const localesFilePath = path.resolve(process.cwd(), 'locales');
const englishFilePath = path.resolve(localesFilePath, 'en-US.json');
const englishFile = fs.readFileSync(englishFilePath, 'utf-8');
const english = JSON.parse(englishFile);

function localize (localeFileName, string) {
  let locale = english;
  if (localeFileName !== 'en-US.json') {
    const localeFilePath = path.resolve(localesFilePath, localeFileName);
    const localeFile = fs.readFileSync(localeFilePath, 'utf-8');
    locale = JSON.parse(localeFile);
  }
  
  const localeName = localeFileName.split('.')?.[0] ?? 'en-US';
  string = string.replace(/\{\{localeName\}\}/g, localeName);

  // Use default English locale file to fill any missing translations
  Object.keys(english).forEach(key => {
    const regex = new RegExp('\{\{translate: ?' + key + '\}\}', 'g');
    let translation = (locale[key] ?? english[key]).replace(/(['"])/g, '\\$1'); // Escape quotes, just in case
    if (key === 'javascriptRequired') {
      translation = `<a href="https://src.feather.wiki/#browser-compatibility">${translation}</a>`;
    }
    string = string.replace(regex, translation);
  });

  return string;
}

function injectVariables(content) {
  const matches = content.match(/(?<={{)package\.json:.+?(?=}})/g);
  let result = content;
  if (matches?.length > 0) {
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
  }
  return result;
}

const minifyOptions = {
  collapseWhitespace: true,
  conservativeCollapse: true,
  collapseInlineTagWhitespace: true,
  decodeEntities: true,
  removeAttributeQuotes: true,
  continueOnParseError: true,
  removeComments: true,
  removeEmptyAttributes: true,
  removeRedundantAttributes: true,
};

function build(localeFileName) {
  const localeName = localeFileName.split('.')?.[0] ?? 'en-US';
  return esbuild.build({
    entryPoints: ['index.js'],
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    sourcemap: false,
    write: false,
    bundle: true,
    minify: true,
    treeShaking: true,
    plugins: [
      {
        name: 'transformContentPlugin',
        setup(build) {
          build.onLoad({ filter: /\.js$/ }, async (args) => {
            // All transformations are done in one plugin because filter by js file stops working in subsequent plugins
            const fileName = path.relative(process.cwd(), args.path);
            let contents = await fs.promises.readFile(fileName, 'utf8');

            try {
              contents = localize(localeFileName, contents);
            } catch (e) {
              console.error(e);
              return { errors: [e] };
            }

            try {
              contents = injectVariables(contents);
            } catch (e) {
              console.error(e);
              return { errors: [e] };
            }

            contents = contents.replace(/(let|const)\s/g, 'var ');

            try {
              const minified = minifyHTMLLiterals(contents, {
                fileName,
                minifyOptions,
                shouldMinify(template) {
                  return (
                    defaultShouldMinify(template) ||
                    template.parts.some(part => part.text.includes('<!DOCTYPE html>'))
                  );
                }
              });

              if (minified) {
                contents = minified.code;
              }
            } catch (e) {
              console.error(e);
              return { errors: [e] };
            }

            return { contents };
          });
        },
      },
    ],
    platform: 'browser',
    format: 'iife',
    target: 'es2015',
    outdir: 'build',
  }).then(async result => {
    const fileName = path.relative(process.cwd(), 'index.html');
    let html = await fs.promises.readFile(fileName, 'utf8');
    for (const out of result.outputFiles) {
      let output = new TextDecoder().decode(out.contents);
      if (/\.js$/.test(out.path)) {
        const jsFilename = `FeatherWiki-bones_${packageJson.nickname}${localeName !== 'en-US' ? `_${localeName}` : ''}.js`;
        const jsOutPath = path.resolve(outputDir, jsFilename);
        fs.writeFileSync(jsOutPath, output);
        const jsKb = (Uint8Array.from(Buffer.from(output)).byteLength * 0.000977).toFixed(3) + ' kilobytes';
        console.info(jsOutPath, jsKb);

        // I can't do replace because of the regex stuff in here,
        const htmlParts = html.split('{{jsOutput}}'); // But this does exactly what I need!
        html = htmlParts[0] + output + htmlParts[1];
      }
    }
    return html;
  }).then(async html => {
    // Inject any hanging variables into the resulting HTML
    const htmlParts = html.split('{{cssOutput}}');
    html = htmlParts[0] + cssOutput + htmlParts[1];
    html = localize(localeFileName, html);
    html = injectVariables(html);
    const filename = `FeatherWiki_${packageJson.nickname}${localeName !== 'en-US' ? `_${localeName}` : ''}.html`;
    const filePath = path.resolve(outputDir, filename);
    const outHtml = minify(html, minifyOptions);
    const outputKb = (Uint8Array.from(Buffer.from(outHtml)).byteLength * 0.000977).toFixed(3) + ' kilobytes';
    await fs.writeFile(filePath, outHtml, (err) => {
      if (err) throw err;
      console.info(filePath, outputKb);
    });
    return { size: outputKb };
  }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

// Build all locales except for the en-US locale.
const locales = fs.readdirSync(localesFilePath, { encoding: 'utf-8' });
locales.filter(locale => !locale.startsWith('en-US') && locale.endsWith('.json'))
  .forEach(async (localeFileName) => {
    await build(localeFileName);
  });

// Build, then update README with new size
build('en-US.json').then(async result => {
  const filePath = path.resolve(process.cwd(), 'README.md');
  let readme = await fs.promises.readFile(filePath, 'utf-8');
  readme = readme.replace(/^A \d+\.?\d+ kilobyte/m, `A ${result.size.replace(/s$/, '')}`);
  await fs.writeFile(filePath, readme, (err) => {
    if (err) throw err;
    console.info('README.md updated');
  });
});
