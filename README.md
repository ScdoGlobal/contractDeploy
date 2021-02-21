# contractDeploy
A tool for fast contract deployment on SCDO

## Instructions

1. Download solc.js (choose the version you need) and put it in solc directory
2. Install Node (for older versions of solc.js, you may need an older version of Node)
3. Put all the contracts under a directory (it is ok to have subdirectories)
3. Modify parameters in driver.js
4. Run

```
        node driver.js
```

## Parameters

### skipCompile

Complie the contracts if skipCompile = false

### skipDeploy

Deploy the contracts to SCDO mainnet if skipDeploy false

### addressbook

Leave it empty for the first time. If you have deployed some of the contracts and know their addresses, then you can put the information in the addressbook. 

### constructorbook
Only used when the contract has a constructor that requires parameters

### rawTx
The tx template that you will use for each tx. Note that the AccountNonce and Payload fields will be modified at runtime.

### pri
The private key of the sender

### host
The node ip and port where you want to send tx

### dir
The directory where the contracts are located

### ver
The version of solc

### interval
The interval between sending two consecutive transactions




