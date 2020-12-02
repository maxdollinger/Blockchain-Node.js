const rndString = require('./random');
const { SHA3 } = require('sha3');

const Blockchain = [];
const register = {};
const pendingDocuments = {};

createDocument(`Genesis Block the first of its kind.`)
mineBlock();

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

     const newBlock = {
          blockNumber: Blockchain.length,
          timeStamp: 0,
          hash: 0,
          nonce: 0,
          prevBlockHash,
          data: {...pendingDocuments}
     };

     return newBlock;
}


function addBlock(block) {
     Blockchain.push(block);

     Object.keys(block.data).forEach( docId => {
          register[docId] = block.blockNumber;
          delete pendingDocuments[docId];
     })
}

function createBlockHash(block) {
     const dataToHash = block.blockNumber + block.prevBlockHash + block.nonce + JSON.stringify(block.data);
     const hash = new SHA3(512);

     const newHash = hash.update(dataToHash).digest('hex');
     hash.reset();

     return newHash;
}

function mineBlock() {
     const block = createBlock();

     block.nonce = 0
     let hash = createBlockHash(block);

     while(!hash.startsWith('0')) {
          block.nonce++;
          hash = createBlockHash(block);
     }

     block.hash = hash;
     block.timeStamp = Date.now();

     addBlock(block);

     return block;
}

function isDocumentValid(doc) {
     const isValidDocument = Object.keys(doc).toString() === 'id,timeStamp,data';
     const isIdValid = doc.id.replace(/[a-f0-9]{64}/, '').length === 0 ? true : false;

     return isValidDocument && isIdValid;
}

function isBlockValid(block) {
     const isStructureValid = Object.keys(block).toString() === 'blockNumber,timeStamp,hash,nonce,prevBlockHash,data';
     const isHashValid = createBlockHash(block) === block.hash;

     const docsValid = Object.values(block.data).filter(doc => !isDocumentValid(doc)).length === 0 ? true : false;

     return isStructureValid && isHashValid && docsValid;
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

     setChain(chain) {
         if(chain.length > Blockchain.length && isChainValid(chain)) {
               Blockchain.splice(0);
               Object.keys(register).forEach( docId => delete register[docId] );

               chain.forEach(block => addBlock(block));
               Object.keys(pendingDocuments).forEach( docId => register[docId] = 'pending' )
                              
               console.log(register);
               return true;
          } else {
               return false;
          }
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
               docs = docs.concat(Object.values(block.data));
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

     addBlock(block) {
          const testChain = [getLasBlock(), block];

          if(isChainValid(testChain)) {
               addBlock(block);
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