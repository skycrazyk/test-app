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

class MyServerResponse extends http.ServerResponse {
  writeHead(...props) {
    let commonHeaders = { 'Access-Control-Allow-Origin': '*' };
    let myProps = [];

    if (props.length === 0) {
      return this;
    } else if (props.length === 1) {
      const [statusCode] = props;
      myProps = [statusCode, commonHeaders];
    } else if (props.length === 2) {
      const [statusCode, headersOrReasonPhrase] = props;

      if (typeof headersOrReasonPhrase === 'string') {
        // headersOrReasonPhrase is reasonPhrase
        myProps = [statusCode, headersOrReasonPhrase, commonHeaders];
      } else {
        // headersOrReasonPhrase is headers
        myProps = [statusCode, { ...headersOrReasonPhrase, ...commonHeaders }];
      }
    } else if (props.length === 3) {
      const [statusCode, reasonPhrase, headers] = props;

      myProps = [
        statusCode,
        reasonPhrase,
        {
          ...headers,
          ...commonHeaders
        }
      ];
    }

    return super.writeHead(...myProps);
  }
}

http
  .createServer({ ServerResponse: MyServerResponse }, function(req, res) {
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

      res.writeHead(200, {
        'Content-Type': 'application/json'
      });

      res.write(JSON.stringify(products));
      res.end();
    }

    // Список идентификаторов дилеров
    else if (/^\/api\/dealers\/?/.test(urlPath)) {
      fs.readdir('./data/', (err, dealers) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.writeHead(404);
            res.end();
          } else {
            res.writeHead(500);
            res.end();
          }
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(
            JSON.stringify(
              dealers.map(dealer => path.basename(dealer, '.json'))
            )
          );
          res.end();
        }
      });
    }

    // Все остальные запросы
    else {
      fs.readFile(path.join(__dirname, 'public', urlPath), (err, content) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.writeHead(404);
            res.end();
          } else {
            res.writeHead(500);
            res.end();
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
