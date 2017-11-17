# Bunker

> A web interface for interacting with your IPFS cluster.

## Install

`npm install`

### Dependencies

The server must be run on a node of `ipfs-cluster`. It is assumed that the IPFS Cluster API is running on "127.0.0.1:9094". It also uses the IPFS API which is assumed to be running on "127.0.0.1:5001" via `go-ipfs` or another implementation.

## Usage

`npm start`

## Security

There is no authentication or authorization in place. The hosted site should only be accessible to trusted parties.

## Contribute

PRs Accepted.

## License

MIT © Tom O'Donnell
