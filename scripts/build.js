import path from 'path';
import fs from 'fs';
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
  'both_es2022': 'Robin',
  'md_es2015': 'Chickadee',
  'md_es2022': 'Hummingbird',
  'html_es2015': 'Finch',
  'html_es2022': 'Sparrow',
};

const version = process.argv[2];
const target = process.argv[3];

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
  return build(args[0], args[1]);
});
Promise.all(builds).then(async results => {
  const filePath = path.resolve(process.cwd(), 'README.md');
  let readme = await fs.promises.readFile(filePath, 'utf8');
  results.forEach(result => {
    const regex = new RegExp(`${result.version}:\\*\\* \`[\\d.]+ kb\``);
    readme = readme.replace(regex, `${result.version}:** \`${result.size}\``);
  });
  await fs.writeFile(filePath, readme, (err) => {
    if (err) throw err;
    console.info('README.md updated for versions:', results.map(r => r.version));
  });
})

function build(buildVersion = 'both', buildTarget = 'es2015') {
  const cuteName = cuteNames[buildVersion + '_' + buildTarget];
  return esbuild.build({
    entryPoints: ['index.js'],
    define: {
      'process.env.NODE_ENV': '"production"',
      'process.env.EDITOR': '"' + buildVersion + '"',
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
    target: [ buildTarget ],
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
      // const outputKb = out.contents.byteLength * 0.000977;
      // console.info(`${out.path} (${cuteName})`, outputKb.toFixed(3) + ' kb');
      if (/\.css$/.test(out.path)) {
        html = html.replace('{{cssOutput}}', output);
      } else if (/\.js$/.test(out.path)) {
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
    const outputDir = path.resolve(process.cwd(), 'builds');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    const filePath = path.resolve(outputDir, `FeatherWiki_${cuteName}.html`);
    const outHtml = minify(html, minifyOptions);
    const outputKb = (Uint8Array.from(Buffer.from(outHtml)).byteLength * 0.000977).toFixed(3) + ' kb';
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
