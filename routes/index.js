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
  // Get some basic information about the connected node and its connections.
  var connectedId, pins, peers;
  var promises = [
    ipfsCluster.id(),
    ipfsCluster.pin.ls(),
    ipfsCluster.peers.ls()
  ];

  Promise.all(promises)
    .then((info) => {
      connectedId = info[0].id;
      pins = info[1];
      peers = info[2].map((peer) => { return peer.id});

      // Get more info on each of the pinned items.
      // TODO:  Does this only work for UnixFS objects?
      var statPromises = [];
      for (var i = 0; i < pins.length; i++) {
        var statReq = ipfs.object.stat(pins[i].cid);
        statPromises.push(statReq);
      }
      return Promise.all(statPromises);
    }).then((stats) => {
      for (var i = 0; i < pins.length; i++) {
        pins[i].isDir = stats[i].NumLinks > 0;
      }
      var sortedPins = pins.sort((a, b) => {
        // Directories take priority, then name, then fallback to CID
        var sortResult = 0;
        var areSameType = a.isDir == b.isDir;
        if (!areSameType) {
          sortResult = a.isDir ? -1 : 1;
        } else if (a.name != b.name) {
          sortResult = a.name > b.name ? 1 : -1;
        } else {
          sortResult = a.cid > b.cid ? 1 : -1;  // assumes CIDs never equal
        }
        return sortResult;
      });

      res.render('index', {
        title: 'Bunker',
        id: connectedId,
        pins: pins,
        peers: peers
      });
    }).catch((err) => {
      res.render('error', { error: err });
    })
});

router.get('/browse/*', function(req, res, next) {
  // Get some basic information about the connected node and its connections.
  var connectedId, pins;
  var targetPath = req.params[0];
  var promises = [
    ipfsCluster.id(),
    ipfs.ls(targetPath),
  ];

  Promise.all(promises)
    .then((info) => {
      connectedId = info[0].id;
      pins = info[1].Objects[0].Links;

      var sortedPins = pins.sort((a, b) => {
        // Directories take priority, then name, then fallback to CID
        var sortResult = 0;
        var areSameType = a.Type == b.Type;
        if (!areSameType) {
          sortResult = a - b;
        } else if (a.Name != b.Name) {
          sortResult = a.Name > b.Name ? 1 : -1;
        } else {
          sortResult = a.Hash > b.Hash ? 1 : -1;  // assumes CIDs never equal
        }
        return sortResult;
      });

      res.render('browse', {
        title: 'Bunker',
        id: connectedId,
        pins: pins,
        target: targetPath
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

router.get('/unpin/:hash', function (req, res, next) {
  var unpinHash = req.params['hash'];
  ipfsCluster.pin.rm(unpinHash)
    .then(() => {
      res.redirect('/');
    }).catch((err) => {
      res.render('error', { error: err });
    });
});

module.exports = router;
