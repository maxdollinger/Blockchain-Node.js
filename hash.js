const { SHA3 } = require('sha3');
const { parentPort, workerData } = require('worker_threads');

const {modulus, residueClass, proofOfWork, block} = workerData;

function createBlockHash(block) {
     const dataToHash = block.blockNumber + block.prevBlockHash + block.nonce + JSON.stringify(block.data);
     const hash = new SHA3(512);

     const newHash = hash.update(dataToHash).digest('hex');
     hash.reset();

     return newHash;
}

function mineBlock() {
     block.nonce = residueClass;
     let hash = createBlockHash(block);

     while(!hash.startsWith(proofOfWork)) {
          block.nonce++;
          if(block.nonce % modulus === residueClass) hash = createBlockHash(block);
     }

     block.hash = hash;
     block.timeStamp = Date.now();

     return block;
}

parentPort.postMessage(mineBlock());