const http = require('http');
const fs = require('fs');

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
    const params = new URLSearchParams(req.url.slice(1));
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
  })
  .listen(8080);
