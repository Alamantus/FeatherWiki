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
import { exec } from 'child_process';
import esbuild from 'esbuild';
import { minifyHTMLLiterals, defaultShouldMinify } from 'minify-html-literals';
import { minify } from 'html-minifier';

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

const minifyHTMLLiteralsPlugin = {
  name: 'minifyHTMLLiteralsPlugin',
  setup(build) {
    build.onLoad({ filter: /\.js$/ }, async (args) => {
      const source = await fs.promises.readFile(args.path, 'utf8');
      const fileName = path.relative(process.cwd(), args.path);

      try {
        const result = minifyHTMLLiterals(source, {
          fileName,
          minifyOptions,
          shouldMinify(template) {
            return (
              defaultShouldMinify(template) ||
              template.parts.some(part => {
                return part.text.includes('<!DOCTYPE html>');
              })
            );
          }
        });

        if (result) {
          return { contents: result.code };
        }
        return { contents: source };
      } catch (e) {
        return { errors: [e] }
      }
    })
  }
};

const letsVarConstsPlugin = {
  name: 'letsVarConstsPlugin',
  setup(build) {
    build.onLoad({ filter: /\.js$/ }, async (args) => {
      const source = await fs.promises.readFile(args.path, 'utf8');

      return { contents: source.replace(/(let|const)\s/g, 'var ') };
    })
  }
};

const cuteNames = {
  'both_es2015': 'Dove',
  'both_server': 'Tern',
  'md_es2015': 'Chickadee',
  'md_server': 'Bluethroat',
  'html_es2015': 'Finch',
  'html_server': 'Swallow',
};

const version = process.argv[2];
let target = process.argv[3];
let excludeClosureCompiler = false;
if (target === 'ruffled') {
  target = 'es2015';
  excludeClosureCompiler = true;
}

// This is me spending way too much time just to be lazy
const buildVersions = Object.keys(cuteNames);
const builds = (
  !version && !target
  ? [buildVersions[0]]
  : (
    version === 'all'
    ? buildVersions
    : buildVersions.filter(nameKey => nameKey.includes(version) || nameKey.includes(target))
  )
).map(nameKey => {
  const args = nameKey.split('_');
  return build(args[0], args[1], excludeClosureCompiler);
});
Promise.all(builds).then(async results => {
  const filePath = path.resolve(process.cwd(), 'README.md');
  let readme = await fs.promises.readFile(filePath, 'utf8');
  results.forEach(result => {
    const regex = new RegExp(`${result.version}:\\*\\* \`[\\d.]+ KB\``);
    readme = readme.replace(regex, `${result.version}:** \`${result.size}\``);
  });
  await fs.writeFile(filePath, readme, (err) => {
    if (err) throw err;
    console.info('README.md updated for versions:', results.map(r => r.version));
  });
})

function build(buildEditor = 'both', buildTarget = 'es2015', ruffled = false) {
  const cuteName = cuteNames[buildEditor + '_' + buildTarget];
  return esbuild.build({
    entryPoints: ['index.js'],
    define: {
      'process.env.NODE_ENV': '"production"',
      'process.env.EDITOR': '"' + buildEditor + '"',
      'process.env.SERVER': (buildTarget === 'server').toString(),
    },
    sourcemap: false,
    write: false,
    bundle: true,
    minify: true,
    treeShaking: true,
    plugins: [
      minifyHTMLLiteralsPlugin,
      letsVarConstsPlugin,
    ],
    platform: 'browser',
    format: 'iife',
    target: 'es2015',
    outdir: 'build',
  }).then(async result => {
    const fileName = path.relative(process.cwd(), 'index.html');
    let html = await fs.promises.readFile(fileName, 'utf8');
    const cssResult = esbuild.buildSync({
      entryPoints: ['index.css'],
      write: false,
      bundle: true,
      minify: true,
      outdir: 'build',
    });
    for (const out of [...cssResult.outputFiles, ...result.outputFiles]) {
      let output = new TextDecoder().decode(out.contents);
      // const outputKb = out.contents.byteLength * 0.000977;
      // console.info(`${out.path} (${cuteName})`, outputKb.toFixed(3) + ' KB');
      if (/\.css$/.test(out.path)) {
        html = html.replace('{{cssOutput}}', output);
      } else if (/\.js$/.test(out.path)) {
        if (!ruffled) {
          const developDir = path.resolve(process.cwd(), 'develop');
          if (!fs.existsSync(developDir)) {
            fs.mkdirSync(developDir);
          }
          const jsBuildPath = path.resolve(developDir, cuteName + '.js');
          const jsOutPath = path.resolve(developDir, cuteName + '_compressed.js');
          output = await new Promise(resolve => {
            fs.writeFileSync(jsBuildPath, output);
            // Compress the JS even more
            exec(`npx google-closure-compiler --js=${jsBuildPath} --js_output_file=${jsOutPath}`, {
              maxBuffer: 2 * 1024 * 1024, // Double the default maxBuffer
            }, (err) => {
              if (err) throw err;
              resolve(fs.readFileSync(jsOutPath));
            });
          });
          // Remove generated JS files
          fs.unlink(jsBuildPath, () => {});
          fs.unlink(jsOutPath, () => {});
        }

        // remove choo's window restriction in Choo.prototype.toString()
        output = output.toString().replace(/.\.notEqual\(typeof window,"object","choo\.mount: window was found\. \.toString\(\) must be called in Node, use \.start\(\) or \.mount\(\) if running in the browser"\);/i, '');
        
        // Since there's regex stuff in here, I can't do replace!
        const htmlParts = html.split('{{jsOutput}}'); // But this does exactly what I need
        html = htmlParts[0] + output + htmlParts[1];
      }
    }
    return html;
  }).then(async html => {
    const fileName = path.relative(process.cwd(), 'package.json');
    const packageJsonFile = await fs.promises.readFile(fileName, 'utf8');
    const packageJson = JSON.parse(packageJsonFile);

    const matches = html.match(/(?<={{)package\.json:.+?(?=}})/g);

    if (matches?.length > 0) {
      let result = html;
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

      return result;
    }
  }).then(async html => {
    html = html.replace(/{{buildVersion}}/g, cuteName);
    const outputDir = path.resolve(process.cwd(), 'builds');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    const filePath = path.resolve(outputDir, `FeatherWiki_${ruffled ? 'ruffled-' : ''}${cuteName}.html`);
    const outHtml = minify(html, minifyOptions);
    const outputKb = (Uint8Array.from(Buffer.from(outHtml)).byteLength * 0.000977).toFixed(3) + ' KB';
    await fs.writeFile(filePath, outHtml, (err) => {
      if (err) throw err;
      console.info(filePath, outputKb);
    });
    return { version: cuteName, size: outputKb };
  }).catch((e) => {
    console.error(e);
    process.exit(1)
  });
}
