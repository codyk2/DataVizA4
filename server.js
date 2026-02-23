const http = require('http');
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const port = 8123;

const mimeTypes = {
  '.html': 'text/html',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.css': 'text/css',
  '.js': 'text/javascript',
};

http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/preview.html' : req.url;
  filePath = path.join(dir, filePath);
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}).listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
