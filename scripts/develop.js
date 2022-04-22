import path from 'path';
import fs from 'fs';
import http from 'http';
import esbuild from 'esbuild';
import babel from 'esbuild-plugin-babel';

const outputDir = path.resolve(process.cwd(), 'develop');
const outputFilePath = path.resolve(outputDir, 'index.html');

// Create an instance of the http server to handle HTTP requests
const server = http.createServer((req, res) => {
  // Set a response type of plain text for the response
  res.writeHead(200, {'Content-Type': 'text/html'});

  // Send back a response and end the connection
  res.end(fs.readFileSync(outputFilePath));
});

const cssResult = esbuild.buildSync({
  entryPoints: ['index.css'],
  write: false,
  bundle: true,
  minify: false,
  outdir: 'build',
});

esbuild.build({
  entryPoints: ['index.js'],
  define: {
    'process.env.NODE_ENV': '"development"',
    'process.env.NODE_DEBUG': '"debug"',
  },
  sourcemap: 'inline',
  write: false,
  bundle: true,
  minify: false,
  watch: {
    onRebuild(error, result) {
      if (error) console.error('watch build failed:', error)
      else {
        console.info('watch build succeeded:', result.outputFiles.map(f => f.path));
      }
    },
  },
  plugins: [
    babel(),
  ],
  platform: 'browser',
  // target: [ 'es5' ],
  outdir: 'build',
}).then(async result => {
  const fileName = path.relative(process.cwd(), 'index.html');
  let html = await fs.promises.readFile(fileName, 'utf8');
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
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  await fs.writeFile(outputFilePath, html, (err) => {
    if (err) throw err;
    const outputKb = Uint8Array.from(Buffer.from(html)).byteLength * 0.000977;
    console.info(outputFilePath, outputKb.toFixed(3) + ' kb');
  });
}).then(() => {
  if (!server.listening) {
    // Start the server on port 3000
    server.listen(3000, 'localhost');
    console.log('Node server running at http://localhost:3000');
  }
})
  .catch((e) => {
    console.error(e);
    process.exit(1)
  });
