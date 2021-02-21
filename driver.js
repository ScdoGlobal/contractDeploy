const ScdoDeployer = require('./deploycontract');

// compiling options
var skipDeploy  = false
var skipCompile = false

let addressbook = {
    //  "ECRecovery.sol": "1S0186d368e714e9db533a7fea04c6caa8fdd60002",
    //  "Merkle.sol": "1S011e730a59374f90f139690da25857b708e00002",
    //  "RLP.sol": "1S012cbf2d8122633fab3ea625127e66c5acc30032",
    //  "RLPEncoding.sol": "1S01fdbf96e021d5025f8865e9c443b8c6ed0f0032",
    //  "SafeMath.sol": "1S013344c881fdfb8133dfeb318b1fc8ea39800012",
    //  "StemCore.sol": "1S010c2b221d541194b7863cf52ab40d38dc820002",
    //  "StemCreation.sol": "1S014bdac4d6e86f4510f079b57e5c922be4060022",
    //  "StemChallenge.sol": "1S01b717711eb7d2e6fa65529e098bb335f2d10012",
    //  "StemRelay.sol": "1S01e4b4b7e95125011fc52f97b717e80d147a0002"
  }
  
  let constructorbook = {
    // 'StemRootchain.sol': [
    //   [
    //     "bytes32",    // subchain name
    //     "bytes32[]",  // txTreeRoot, BalanceTreeRoot
    //     "bytes32[]",  // staticnodes
    //     "uint256",    // creatorDepo
    //     "address[]",  // op stem account 
    //     "uint256[]",  // op deposit
    //     "address[]"   // op account
    //   ],
    //   [
    //     "0x416e6e6965", 
    //     [
    //       "0x4f2df4a21621b18c71619239c398657a23f198a40a8deff701e340e6e34d0823", 
    //       "0x4f2df4a21621b18c71619239c398657a23f198a40a8deff701e340e6e34d0823"
    //     ], 
    //     [
    //       "0x1071052039"
    //     ], 
    //     "1", 
    //     [
    //       "0x0adB61076AF511b8bAdb1264477ba4Be3D302D86",
    //       "0xfb96c3011d73fecB3F75FFAAac8F02cf83D59298",
    //       "0xca35b7d915458ef540ade6068dfe2f44e8fa733c", 
    //       "0x627306090abab3a6e1400e9345bc60c78a8bef57", 
    //       "0x4b0897b0513fdc7c541b6d9d7e929c4e5364d2db", 
    //       "0x583031d1113ad414f02576bd6afabfb302140225"
    //     ], 
    //     [
    //       "0",
    //       "0",
    //       "100", 
    //       "100", 
    //       "100", 
    //       "100"
    //     ],
    //     [
    //       "0x0000000000000000000000000000000000000000",
    //       "0x0000000000000000000000000000000000000000",
    //       "0x3f78b08f45730f59a15319af41ba5a750021c541", 
    //       "0x73028d6a6876b9b82904c018732aea7210806b81", 
    //       "0x4705827853e60f7387595eeea9aac6dfad23e441", 
    //       "0xced07219896b40c953df5408231b41f006ebc8d1"
    //     ]
    //   ],
    //   10000
    // ]
  }

// the tx amount will be modified by the constructor book, the payload and account nonce will 
// be modified at runtime; 
var rawTx = {
    "Type" :0,
    "From" : "1S012f78f8c0c0cc4c8a1bdd0e78bf574eb331d3b1",
    "To" : "0S0000000000000000000000000000000000000000",
    "Amount" : 0,     
    "AccountNonce" : 0,
    "GasPrice":1,
    "GasLimit":8000000,
    "Timestamp":0,
    "Payload": ""
}
var pri = "0x3aad68ecab58517e87a335501da8a5426941ee2a71bf7a08a7f810fb36355adc"
var host = "http://74.208.207.184:8037"
var dir = "testcontracts"
var ver   = "0.5.0"
// time interval of sending tx (in ms) 
var interval = 20000

var deployer = new ScdoDeployer(host, ver, dir, rawTx, pri, addressbook, constructorbook, skipDeploy, skipCompile, interval)
deployer.autodeploy()