const http = require('http');
const fs = require('fs');
const path = require('path');

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

    if (urlPath === '/') {
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
    } else {
      fs.readFile(path.join(__dirname, 'public', urlPath), (err, content) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.writeHead(404);
            res.end();
          } else {
            throw err;
          }
        } else {
          res.writeHead(200);
          res.write(content);
          res.end();
        }
      });
    }
  })
  .listen(8080);
