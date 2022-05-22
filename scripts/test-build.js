import fs from 'fs';
import path from 'path';
import http from 'http';

const version = process.argv[2] ?? 'Tern';

// Create an instance of the http server to handle HTTP requests
let app = http.createServer((req, res) => {
    // Set a response type of plain text for the response
    res.writeHead(200, {
        'Content-Type': 'text/html',
        'dav': 1,
    });

    if (req.method === 'PUT') {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });
        req.on('end', () => {
            const filePath = path.resolve(process.cwd(), 'develop', 'put-save.html');
            fs.writeFile(filePath, data, (err) => {
                if (err) throw err;
                const outputKb = (Uint8Array.from(Buffer.from(data)).byteLength * 0.000977).toFixed(3) + ' kb';
                console.info(filePath, outputKb);
              });
            res.end();
        });
    }

    // Send back a response and end the connection
    res.end(fs.readFileSync(path.resolve(process.cwd(), 'builds', `FeatherWiki_${version}.html`)));
});

// Start the server on port 3000
app.listen(3000, 'localhost');
console.log('Node server running at http://localhost:3000');