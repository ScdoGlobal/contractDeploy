// file system methods
const fs    = require('fs-extra')
const fsPromises = require("fs").promises
const path  = require('path')

// terminal-kit
const term  = require( 'terminal-kit' ).terminal

// solc and web3
const solc  = require('solc')
const Web3  = require('web3')
const web3  = new Web3

// scdo.js
const scdojs  = require('./scdojs/scdo.js');

// file to store temporary compilation result
const temp  = path.join(__dirname, 'comptemp.json')

// directory for abi files
const abidir= path.join(__dirname, 'abidir')

class ScdoDeployer {
  constructor(host, ver, dir, rawTx, pri, addressbook, constructorbook, skipDeploy, skipCompile, interval) {
    this.host = host || 'http://localhost:8037';
    this.contractdir = path.join(__dirname, dir);
    this.rawTx = rawTx;
    this.pri = pri;
    this.addressbook = addressbook;
    this.constructorbook = constructorbook;
    this.skipDeploy = skipDeploy;
    this.skipCompile = skipCompile;
    this.sol = path.join(__dirname, 'solc', ver);
    this.ver = ver;
    this.client = new scdojs(this.host).client;
    this.interval = interval;
  }

async autodeploy(dir = this.contractdir){
    
    return new Promise(function(resolve, reject) {
      this.contractOrder(dir).then( async (contract) => {
        console.log(`Sorted`);
        if (this.skipCompile) {
          console.log(`Skip compile`);
          // temp contains a json file with the payload, abi, version of each contract
          return fsPromises.readFile(temp).then( content => {
            return JSON.parse(content.toString());
          })
        } else {
          return this.compilepromise(contract.code, this.sol).then( output => {
            fs.writeJsonSync(temp, { output: output, order: contract.sort})
            return {
                output: output,
                order:  contract.sort 
            };
          })
        }
      }).then( async (info) => {
        if ( this.skipDeploy ) {
          resolve('Skip deploy')
          return
        }
        for ( var contract of info.order ) {
          var data = this.findByField(info.output, 'contract', contract)
          if (data.payload === "0x") {
            continue
          }
          var payloadcomplete = data.payload.replace(/__test.sol:[a-zA-Z]*_*/g, function(x){
            var name = x.slice(11).replace(/_*/g, '') + '.sol'
            return this.addressbook[name].slice(2)
          })
          
          var amount    = 0
          if (this.constructorbook[contract] != undefined) {
            var constructor = web3.eth.abi.encodeParameters(this.constructorbook[contract][0], this.constructorbook[contract][1]).slice(2)
            payloadcomplete += constructor
            amount = this.constructorbook[contract][2];
          }
          
          if (this.addressbook != undefined && this.addressbook[contract] != undefined ) {
            console.log(`Skip ${contract}`);
            continue;
          }
          
          console.log(`Deploy ${contract}`);

          this.rawTx.Payload = payloadcomplete
          var nonce = await this.client.getAccountNonce(this.rawTx.From,'',-1)
          this.rawTx.AccountNonce = nonce
          if (amount > 0) {
              this.rawTx.Amount = amount
          }
          
          var receipt = await this.mustSend(this.rawTx, this.pri)
          console.log(`"${contract}": "${receipt}" \n`);
          // use receipt to fill the addressbook
          this.addressbook[contract] = receipt
        }
        console.log(this.addressbook)
        resolve('complete')
      }).catch( err => {
        console.log(new Error(err));
      })
    }.bind(this));
  }

  // read sol files recursively
  // usage: getFiles(dir)
  async getFiles(curpath = "./") {
    if (curpath !== "./") {
      curpath = curpath + "/"
    }
    const entries = await fsPromises.readdir(curpath, { withFileTypes: true });

    // Get files within the current directory and add a path key to the file objects
    const files = entries
        .filter(file => !file.isDirectory()).filter(file => file.name.endsWith(".sol"))
        .map(file => ({ ...file, path: curpath + file.name }));

    // Get folders within the current directory
    const folders = entries.filter(folder => folder.isDirectory());

    for (const folder of folders)
        /*
          Add the found files within the subdirectory to the files array by calling the
          current function itself
        */
        files.push(...await this.getFiles(`${curpath}${folder.name}`));

    return files;
  }

  async contractOrder(dir){
    return new Promise(function(resolve, reject) {
      this.getFiles(dir).then( async (files) => {   
        var read = []
        for ( var file of files ) {
          var content = await fsPromises.readFile(file.path)
          read.push({
            name    : file.name,
            content : content.toString()
          })
        }
        return read
      }).then( async (files) => {
        var dinfo = []
        var combo = ''
        for ( var file of files ) {
          var match = file.content.match(/import.*;/g)
          var needs = []
          if ( match != null ) needs = match.map(x => x.match(/[a-zA-Z_]+[a-zA-Z0-9_]*\.sol/g)[0]);
          dinfo.push({ 
            name: file.name, 
            content: file.content,
            dependencies: needs
          })
        }
  
        var sorted = []
        while ( dinfo.length > sorted.length ) {
          for ( var contract of dinfo ) {
            var covered = true
            for ( var dependency of contract.dependencies ) {
              if ( !sorted.includes(dependency) ) {
                covered = false;
              }
            }
            if ( covered && !sorted.includes(contract.name)){ 
              sorted.push(contract.name)
              term
              .nextLine(0)
              .eraseLineAfter()
              .yellow(dinfo.length, '/', sorted.length, ' ');
              combo += contract.content
            }
          }
        }
      
        // TODO: add `pragma experimental ABIEncoderV1;\n` or `pragma experimental ABIEncoderV2;\n` 
        // or `pragma experimental SMTChecker;` if necessary
        // see https://docs.soliditylang.org/en/v0.8.0/layout-of-source-files.html
        var combined = `pragma solidity ${this.ver};\n` + combo.replace(/.*import [\s\S]*?;/g,'').replace(/pragma.*;/g,'').replace(/.*SPDX-License-Identifier.*/g,'')
        console.log(sorted)
        resolve({
          sort: sorted,
          code: combined
        })
      }).catch(err => reject(err))
    }.bind(this))
  }

  async compilepromise(code, solidityPath){
      return new Promise((resolve, reject)=>{ path.join()
        var solcc = solc.setupMethods(require(solidityPath))
        // for debugging
        // fs.writeFile('code.txt', code, (err) => { 
        //   // In case of a error throw err. 
        //   if (err) throw err; 
        // }) 
        var input = {language: 'Solidity',sources: {'test.sol': {content: code}},settings: {outputSelection: {'*': {'*': ["*"]}}}}

        console.log('Compiling');
        var output = JSON.parse(solcc.compile(JSON.stringify(input)))
        console.log('Compiled');
        // for debugging
        // fs.writeFile('Output.json', JSON.stringify(output), (error) => {
        //   if (error) throw error;
        // });
        var contracts = []
        for ( var contractName in output.contracts['test.sol']){
          console.log(contractName)
          var abstract = {
            "contract": contractName+'.sol',
            "payload" : "0x"+output.contracts['test.sol'][contractName].evm.bytecode.object,
            "abi"     : JSON.stringify(output.contracts['test.sol'][contractName].abi)
          }
          contracts.push(abstract)
        }
        fs.ensureDir(abidir, err => {
          console.log(err) // => null
          var writers = []
          for ( var contract of contracts ) {
            var data = JSON.parse(contract.abi)
            var name = contract.contract.replace(/\.sol/,'.json')
            var abis = path.join(abidir, name)
            writers.push(fs.writeJSON( abis, data, {overwrite: true, EOL:'\n', spaces:'\t'}))
          }
          Promise.all(writers).then( () => {
            resolve(contracts)
          })
        })
      })
  }

  findByField(list, field, name){
    for ( var item of list ) {
      if (item[field] == name ) {
        return item
      }
    }
  }

  async mustSend(rawTx, pri){
    return new Promise(async function(resolve, reject) {

    var nonce = await this.client.getAccountNonce(rawTx.From,'',-1)
    rawTx.AccountNonce = nonce
    var tx = this.client.generateTx(pri, rawTx)
               
    var notabort = true
        
    var bgin = Date.now()
    var diff = 1
    // send loop 
    try {
        var notyet = true
        var time, info, send, txbh, rcbh, fail = null
        
        while ( notyet && notabort) {
            console.log(notyet)
            
            time, info, send, txbh, rcbh, fail = null
            var result = await Promise.all([
                this.client.getInfo(),
                this.client.addTx(tx),
                this.client.getTransactionByHash(tx.Hash),
                this.client.getReceiptByTxHash(tx.Hash,"")
            ]).then( async (result) => {
                if (result[0].error ) { info = result[0].error.message }
                else {
                  info = result[0].CurrentBlockHeight - result[2].blockHeight 
                  if ( !Number.isInteger(info) ) info = '_'
                }
                if (result[1].error ) { send = result[1].error.message }
                else send = result[1]
                if (result[2].error ) { txbh = result[2].error.message }
                else txbh = result[2].status
                if (result[3].error ) { rcbh = result[3].error.message }
                else { 
                  rcbh = result[3].contract
                  fail = result[3].failed
                }
                time = Date.now()
                term
                .previousLine(1)
                .eraseLineAfter()
                .cyan(parseInt((time - bgin)/1000), 's :')
                .white( `status: ${txbh}`)
                .blue(` depth: ${info}/${diff}`)
                .green(` receipt: ${rcbh}`)
                .yellow(` send: "${send}"` )
                .green(` fail: ${fail}\n`)
                await this.sleep(this.interval)
                if ( txbh == 'block'
                   && send == 'Tx already exists'
                   && info >= diff
                   && /.S.*/.test(rcbh) ) 
                {
                  notyet = false
                  resolve(result[3].contract)
                }
            }).catch( e => {
                console.error(e);
              })
            } 
        } catch (err) {
            reject(err)
        }
        
        resolve(tx)
     }.bind(this));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}

module.exports = ScdoDeployer;
