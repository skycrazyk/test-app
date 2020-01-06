const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8080;

function getProducts(dataFiles) {
  return dataFiles.reduce((acc, fileName) => {
    try {
      const dealerData = JSON.parse(
        fs.readFileSync(`./data/${fileName}`, 'utf8')
      );

      const nextAcc = [...acc, ...dealerData];

      return nextAcc;
    } catch (e) {
      if (e.code === 'ENOENT') return acc;
      throw e;
    }
  }, []);
}

http
  .createServer(function(req, res) {
    const [urlPath, query] = req.url.split('?');

    // Запрос товаров
    if (/^\/api\/goods\/?/.test(urlPath)) {
      const params = new URLSearchParams(query);
      const dealers = params.get('dealers');

      let products = [];

      if (dealers) {
        // get particular dealers
        const dataFiles = dealers.split(',').map(i => `${i}.json`);
        products = getProducts(dataFiles);
      } else {
        // get all dealers
        const dataFiles = fs.readdirSync('./data/');
        products = getProducts(dataFiles);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify(products));
      res.end();
    }
    // Все остальные запросы
    else {
      fs.readFile(path.join(__dirname, 'public', urlPath), (err, content) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.writeHead(404);
            res.end();
          } else {
            throw err;
          }
        } else {
          const ext = path.extname(urlPath);
          let contentType = '';

          switch (ext) {
            case '.png':
              contentType = 'image/png';
              break;
            case '.html':
              contentType = 'text/html';
              break;
            case '.css':
              contentType = 'text/css';
              break;
          }

          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content);
        }
      });
    }
  })
  .listen(port);
