module.exports = clusterPinToIpfsPin

function clusterPinToIpfsPin (clusterPin) {
  var ipfsPin = {
    Name: clusterPin.name,
    Hash: clusterPin.cid
  }
  return ipfsPin
}
