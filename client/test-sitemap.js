import handler from './api/sitemap.js';

const req = {};
const res = {
  setHeader: (k, v) => console.log(`Header: ${k} = ${v}`),
  status: (code) => { console.log(`Status: ${code}`); return res; },
  send: (data) => console.log(`Send:\n${data}`),
  json: (data) => console.log(`Json:\n${JSON.stringify(data)}`),
};

handler(req, res).then(() => console.log('Done'));
