import fs from 'fs';
import path from 'path';
import http from 'http';

// Create an instance of the http server to handle HTTP requests
let app = http.createServer((req, res) => {
    // Set a response type of plain text for the response
    res.writeHead(200, {'Content-Type': 'text/html'});

    // Send back a response and end the connection
    res.end(fs.readFileSync(path.resolve(process.cwd(), 'docs', 'FeatherWiki.html')));
});

// Start the server on port 3000
app.listen(3000, 'localhost');
console.log('Node server running on port 3000');