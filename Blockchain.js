const rndString = require('./random');
const { Worker } = require('worker_threads');
const { SHA3 } = require('sha3');
const os = require('os');

const threads = os.cpus().length;
const proofOfWork = '0000';

const Blockchain = [];
const register = {};
const pendingDocuments = {};

function getLasBlock() {
     return Blockchain[Blockchain.length-1]
}

function createDocument(data) {
     let id = rndString({length: 64});
     while(register.hasOwnProperty(id)) {
          id = rndString({length: 64});
     }

     const document = {
          id,
          timeStamp: Date.now(),
          data
     }

     addDocument(document);
     return document;
}

function addDocument(document) {
     pendingDocuments[document.id] = document;
     register[document.id] = 'pending';
}

function createBlock() {
     const prevBlockHash = Blockchain.length > 0 ? getLasBlock().hash : 0;
     const data = {...pendingDocuments};


     return {
          blockNumber: Blockchain.length,
          timeStamp: 0,
          hash: 0,
          nonce: 0,
          prevBlockHash,
          data
     };
}

function createBlockHash(block) {
     const dataToHash = block.blockNumber + block.prevBlockHash + block.nonce + JSON.stringify(block.data);
     const hash = new SHA3(512);

     const newHash = hash.update(dataToHash).digest('hex');
     hash.reset();

     return newHash;
}

function addBlock(block) {
     Blockchain.push(block);

     Object.keys(block.data).forEach( docId => {
          register[docId] = block.blockNumber;
          delete pendingDocuments[docId];
     })
}

function mineBlock() {
     return new Promise((resolve, reject) => {
          const block = createBlock();
          const workers = [];

          for(let i = 0; i < threads; i++) {
               const thread = new Worker('./hash.js', { workerData: {
                    modulus: threads,
                    residueClass: i,
                    proofOfWork,
                    block} } );

               workers.push(thread);
          
               thread.on('message', block => {
                    workers.forEach(worker => worker.terminate());
                    addBlock(block);
                    resolve(block);
               });

               thread.on('messageerror', err => reject(err));
          }
     })
}

function isDocumentValid(doc) {
     const isValidDocument = Object.keys(doc).toString() === 'id,timeStamp,data';
     const isIdValid = doc.id.replace(/[a-f0-9]{64}/, '').length === 0;

     return isValidDocument && isIdValid;
}

function isBlockValid(block) {
     const isStructureValid = Object.keys(block).toString() === 'blockNumber,timeStamp,hash,nonce,prevBlockHash,data';
     const isWorkProven = block.hash.startsWith(proofOfWork);
     const isHashValid = createBlockHash(block) === block.hash;

     const docsValid = Object.values(block.data).filter(doc => !isDocumentValid(doc)).length === 0;

     return isStructureValid && isWorkProven && isHashValid && docsValid ;
}

function isChainValid(chain) {
     chain = chain ? chain : Blockchain;

     let index = 1;
     let isChainValid = isBlockValid(chain[0]);

     while(isChainValid && index < chain.length) {
          const block = chain[index];
          const prevBlock = chain[index-1];

          const blockValid = isBlockValid(block);
          const isPrevHashValid = prevBlock.hash === block.prevBlockHash;
          const isBlockNumberValid = block.blockNumber === prevBlock.blockNumber+1;

          isChainValid = isPrevHashValid && isBlockNumberValid && blockValid;

          index++;
     }

     return isChainValid;
}

class Interface {

     getChain() {
          return [...Blockchain];
     }

     getPendingDocuments() {
          return {...pendingDocuments};
     }

     getDocumentById(docId) {
          const blockNumber = register[docId];
          return {...Blockchain[blockNumber].data[docId]};
     }

     getAllDocuments() {
          let docs = [];

          Blockchain.forEach(block => {
               Object.values(block.data).forEach(doc => docs.push({...doc}));
          })

          return docs;
     }

     createDocument(data) {
          return createDocument(data)
     }

     addDocument(doc) {
          if(isDocumentValid(doc)) {
               addDocument(doc);
               return true;
          } else {
               return false;
          }
     }

     setPendingDocuments(docs) {
          Object.values(docs).forEach(doc => {
               if(isDocumentValid(doc)) pendingDocuments[doc.id] = doc;
          } );
     }

     addBlock(block) {
          const testChain = [getLasBlock(), block];

          if(isChainValid(testChain)) {
               addBlock(block);
               return true;
          } else {
               return false;
          }
     }

     setChain(chain) {
          if(chain.length > Blockchain.length && isChainValid(chain)) {
                Blockchain.splice(0);
                Object.keys(register).forEach( docId => delete register[docId] );
 
                chain.forEach(block => addBlock(block));
                Object.keys(pendingDocuments).forEach( docId => register[docId] = 'pending' )
 
                return true;
           } else {
                return false;
           }
      }

     mineBlock() {
          return mineBlock();
     }

}

module.exports = new Interface();
