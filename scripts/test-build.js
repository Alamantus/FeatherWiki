/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
import fs from 'fs';
import path from 'path';
import http from 'http';

const version = process.argv[2] ?? 'ruffled-Warbler';
const servePath = path.resolve(process.cwd(), 'builds', `FeatherWiki_${version}.html`);

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
            const savePath = path.resolve(process.cwd(), 'develop', 'put-save.html');
            fs.writeFile(savePath, data, (err) => {
                if (err) throw err;
                const outputKb = (Uint8Array.from(Buffer.from(data)).byteLength * 0.000977).toFixed(3) + ' kb';
                console.info(savePath, outputKb);
              });
            res.end();
        });
    }

    // Send back a response and end the connection
    res.end(fs.readFileSync(servePath));
});

// Start the server on port 3000
app.listen(3000, 'localhost');
console.log('Node server running at http://localhost:3000 and serving ' + servePath);
