const dns = require('dns');

dns.setServers(['8.8.8.8']);

dns.resolveSrv('_mongodb._tcp.cluster0.qroh4uv.mongodb.net', (err, addresses) => {
    console.log(err);
    console.log(addresses);
});