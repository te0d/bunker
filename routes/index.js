var express = require('express');
var router = express.Router();

// Handling File Uploads
var multer = require('multer')
var multerMemoryStorage = multer.memoryStorage();
var upload = multer({ storage: multerMemoryStorage });

// Interacting with IPFS and IPFS Cluster
var ipfsAPI = require('ipfs-api');
var ipfsClusterAPI = require('ipfs-cluster-api');
var ipfs = ipfsAPI();                             // TODO:  allow non-default endpoints
var ipfsCluster = ipfsClusterAPI();

/* GET home page. */
router.get('/', function(req, res, next) {
  var promises = [
    ipfsCluster.id(),
    ipfsCluster.pin.ls(),
    ipfsCluster.peers.ls()
  ];

  Promise.all(promises)
    .then((info) => {
      var id = info[0].id;
      var pins = info[1];
      var peers = info[2].map((peer) => { return peer.id});

      res.render('index', {
        title: 'Bunker',
        id: info[0].id,
        pins: pins,
        peers: peers
      });
    }).catch((err) => {
      res.render('error', { error: err });
    })
});

router.get('/download/:hash', function(req, res, next) {
  var requestPath = '/ipfs/' + req.params['hash'];
  var downloadName = req.query['name'];
  ipfs.get(requestPath)
    .then((stream) => {
      res.setHeader('Content-disposition', 'attachment; filename=' + downloadName);
      res.setHeader('Content-type', 'text/plain');
      stream.on('data', (file) => {
        file.content.pipe(res);
      });
    }).catch((err) => {
      res.render('error', { error: err });
    });
});

router.post('/upload', upload.single('uploadFileControl'), function (req, res, next) {
  ipfs.add(req.file.buffer)
    .then((ipfsRes) => {
      var newHash = ipfsRes[0].hash;
      return ipfsCluster.pin.add(newHash, { name: req.file.originalname });
    }).then(() => {
      res.redirect('/');
    }).catch((err) => {
      res.render('error', { error: err });
    });
});

module.exports = router;
