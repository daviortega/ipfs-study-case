const IPFS = require('ipfs')
const node = new IPFS({ repo: '.ipfs/data' })


const getPeers = (node) => {
    return node.swarm.peers((err, peers) => {
        if (err)
            throw err
        console.log(peers)
        return peers
    })
}

node.on('ready', () => {
        getPeers
        node.stop()
    })
})
