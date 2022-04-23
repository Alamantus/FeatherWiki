import path from 'path';
import fs from 'fs';
import esbuild from 'esbuild';
import babel from 'esbuild-plugin-babel';
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

esbuild.build({
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
    minifyHTMLLiteralsPlugin,
    babel(),
  ],
  platform: 'browser',
  // target: [ 'es5' ],
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
    const output = new TextDecoder().decode(out.contents);
    const outputKb = out.contents.byteLength * 0.000977;
    console.info(out.path, outputKb.toFixed(3) + ' kb');
    if (/\.css$/.test(out.path)) {
      html = html.replace('{{cssOutput}}', output);
    } else if (/\.js$/.test(out.path)) {
      html = html.replace('{{jsOutput}}', output);
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
  const outputDir = path.resolve(process.cwd(), 'docs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  const filePath = path.resolve(outputDir, 'FeatherWiki.html');
  const outHtml = minify(html, minifyOptions);
  await fs.writeFile(filePath, outHtml, (err) => {
    if (err) throw err;
    const outputKb = Uint8Array.from(Buffer.from(outHtml)).byteLength * 0.000977;
    console.info(filePath, outputKb.toFixed(3) + ' kb');
  });
})
  .catch((e) => {
    console.error(e);
    process.exit(1)
  });
