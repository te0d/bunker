var express = require('express');
var router = express.Router();

var ipfsClusterAPI = require('ipfs-cluster-api');
var ipfsCluster = ipfsClusterAPI();                 // TODO:  allow non-default endpoints

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

module.exports = router;
