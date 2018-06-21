'use strict'

const IPFSFactory = require('ipfsd-ctl')
const IpfsApi = require('ipfs-api')
const fs = require('fs')
const path = require('path')
const through2 = require('through2')

const ipfsPath = '/ipfs/QmY3wmeJuc31xjRBVEKGepB4qjapyMdQkDJisJUT7e8Gw5/rawdata/Ti_a4h_h4_170e13um18K_27nov07.mrc' //'/ipfs/QmPeph5cHyU9TC44RUxVgPKbgEEgT9GUBKnXGwU6aLWzcj/keyimg_yc2015-09-09-98.jpg' // '/ipfs/QmY3wmeJuc31xjRBVEKGepB4qjapyMdQkDJisJUT7e8Gw5/rawdata/Ti_a4h_h4_170e13um18K_27nov07.mrc'
const minPeers = 30


const checkPeers = (ipfs, limit) => {
    return new Promise((resolve, reject) => {
        let numPeers = 0
        const timeId = setInterval(() => {
            ipfs.api.swarm.peers((err, peers) => {
                if (err) throw err
                numPeers = peers.length
                console.log(`Checking for peers and found ${numPeers}`)
                if (peers.length > limit) {
                    clearInterval(timeId)
                    resolve(numPeers)
                }              
            })
        }, 5000)
    })
}

const announcePeersFound = (numPeers) => {
    console.log(`Promise resolved: there are ${numPeers} peers connected to daemon. Time to get some work done.`)
}

IPFSFactory
    .create({ exec: '/usr/local/bin/ipfs'})
    .spawn({ disposable: true }, (err, ipfsd) => {
        if (err) throw err
        ipfsd.api.id((err, id) => {
            console.log('Got the ID, but will wait till we have enough peers')
            checkPeers(ipfsd, minPeers)
                .then(announcePeersFound)
                .then(() => {
                    console.log('Initialize API')
                    const ipfs = IpfsApi(ipfsd.apiAddr)
                    console.log('Start getting tomogram')
                    const streamData = ipfs.files.getReadableStream(ipfsPath)
                    let downloaded = 0
                    streamData
                        .on('error', (err) => {
                            console.log('something is fishy getting the stream')
                            throw err
                        })
                        .on('data', (data) => {
                            console.log('Some data')
                            console.log(data)
                        })
                        .pipe(through2.obj((data, enc, next) => {
                            console.log(`Tomograma is: ${data.path}`)
                            const writeStream = fs.createWriteStream('thisFile.mrc')
                            data.content
                                .on('data', (dataFlow) => {
                                    downloaded += dataFlow.length
                                    console.log(`Progress: ${downloaded}`)
                                })
                                .on('error', (err) => {
                                    console.log('Error in getting the data')
                                    throw err
                                })
                                .pipe(writeStream)
                                .on('finish', () => {
                                    console.log('download done')
                                })
                                .on('error', (err) => {
                                    console.log('Error in processing the data')
                                    throw err
                                })
                        })).on('error', (err) => {
                            console.log('something is fishy')
                            throw err
                        })
            }).catch((err) => {
                console.log('something is fishy')
                throw err
            })
        })
    })
    
/* 
const port = 9090
const server = IPFSFactory.createServer()

const optionsIpfs = {
    disposable: false,
    start: false,
    repoPath: '.ipfs'
}




let numOfTentatives = 0
const initIfNotThere = (ipfs) => {
	// process.stdout.write(chalk.cyan(printMessage('Initializing repository ', messageSpace)))
	return new Promise((resolve, rejects) => {
		if (fs.existsSync(optionsIpfs.repoPath)) {
			// process.stdout.write(chalk.yellow(' found existing repository \n'))
			const apiFileInfo = path.resolve(optionsIpfs.repoPath, 'api')
			if (fs.existsSync(apiFileInfo))
				fs.unlinkSync(apiFileInfo)
			resolve()
		}
		else {
			ipfs.init({directory: optionsIpfs.repoPath}, () => {
				// process.stdout.write(chalk.green(' OK\n'))
				resolve()
			})
		}
	})
}



server.start((err) => {
    if (err) throw err
    console.log('Starting')
    node.spawn(optionsIpfs, (err, ipfs) => {
        if (err) throw err
        console.log('Spawning')
        initIfNotThere(ipfs).then(() => {
            ipfs.start((err, api) => {
                ipfs.api.id(console.log)
                checkPeers(ipfs)
            })
        })
        // server.stop()
    })
})
*/