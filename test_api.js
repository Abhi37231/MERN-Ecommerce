const http = require('http');

http.get('http://localhost:5000/api/v1/products', (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(JSON.stringify(JSON.parse(data), null, 2).substring(0, 1000));
  });
}).on('error', err => {
  console.log('Error: ', err.message);
});
