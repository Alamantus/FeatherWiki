import path from 'path';
import fs from 'fs';
import http from 'http';
import esbuild from 'esbuild';

const outputDir = path.resolve(process.cwd(), 'develop');
const outputFilePath = path.resolve(outputDir, 'index.html');

const editor = process.argv[2] ?? 'both';

esbuild.build({
  entryPoints: ['index.js'],
  define: {
    'process.env.NODE_ENV': '"development"',
    'process.env.NODE_DEBUG': '"debug"',
    'process.env.EDITOR': '"' + editor + '"',
  },
  sourcemap: 'inline',
  write: false,
  bundle: true,
  minify: false,
  watch: {
    onRebuild(error, result) {
      if (error) console.error('watch build failed:', error)
      else {
        handleBuildResult(result)
          .catch((e) => {
            console.error(e);
            process.exit(1);
          });
      }
    },
  },
  plugins: [],
  platform: 'browser',
  target: [ 'es2015' ],
  outdir: 'build',
})
  .then(handleBuildResult)
  .then(startServer)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

async function handleBuildResult (result) {
  const fileName = path.relative(process.cwd(), 'index.html');
  let html = await fs.promises.readFile(fileName, 'utf8');
  const cssResult = esbuild.buildSync({
    entryPoints: ['index.css'],
    write: false,
    bundle: true,
    minify: false,
    outdir: 'build',
  });
  for (const out of [...cssResult.outputFiles, ...result.outputFiles]) {
    const output = new TextDecoder().decode(out.contents);
    const outputKb = out.contents.byteLength * 0.000977;
    console.info(out.path, outputKb.toFixed(3) + ' kb');
    if (/\.css$/.test(out.path)) {
      html = html.replace('{{cssOutput}}', output);
    } else if (/\.js$/.test(out.path)) {
      // Since there's regex stuff in here, I can't do replace!
      const htmlParts = html.split('{{jsOutput}}'); // But this does exactly what I need
      html = htmlParts[0] + output + htmlParts[1];
    }
  }
  
  return injectPackageJsonData(html);
}

async function injectPackageJsonData (html) {
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
      html = html.replace(m.match, m.replace);
    });
  }

  return writeHtmlOutput(html);
}

async function writeHtmlOutput (html) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  await fs.writeFile(outputFilePath, html, (err) => {
    if (err) throw err;
    const outputKb = Uint8Array.from(Buffer.from(html)).byteLength * 0.000977;
    console.info(outputFilePath, outputKb.toFixed(3) + ' kb');
  });
}

async function startServer () {
  const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html'});
  
    res.end(fs.readFileSync(outputFilePath));
  });
  server.listen(3000, 'localhost');
  console.log('Node server running at http://localhost:3000');
}
