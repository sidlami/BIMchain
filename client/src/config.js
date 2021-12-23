//this file is needed so that web3 can interact with a smart contract
//note: once you change the smart contract you need to re-deploy it and get the new adress as well as abi

//the adress of smart contract on ganache (once you start ganache you manually need to change this value)
export const ADRESS = '0xC8e311Af424e2Be14541190C273e9cbDBA21dc1F' 

//the abi of a smart contract stores all functions and its relevant infromation, like input and output data type
export const ABI = [
	{
		"inputs": [],
		"name": "getOffchainModels",
		"outputs": [
			{
				"internalType": "string[]",
				"name": "",
				"type": "string[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "urn_new_offchain_model",
				"type": "string"
			}
		],
		"name": "setOffchainModels",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]

//address of smart contract for onchain ipfs on ganache
export const ADRESS_IPFS = '0x01Cefe566b273adBF23b954f7d0355452Da30E7A'

//ABI for onchain ipfs smart contract
export const ABI_IPFS = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "fileId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "fileHash",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "fileSize",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "fileType",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "fileName",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "uploadTime",
				"type": "uint256"
			}
		],
		"name": "FileUploaded",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "getIPFSModels",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "fileId",
						"type": "uint256"
					},
					{
						"internalType": "string",
						"name": "fileHash",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "fileSize",
						"type": "uint256"
					},
					{
						"internalType": "string",
						"name": "fileType",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "fileName",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "uploadTime",
						"type": "uint256"
					}
				],
				"internalType": "struct Onchain.File[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getPersonalModelCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_fileHash",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "_fileSize",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "_fileType",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_fileName",
				"type": "string"
			}
		],
		"name": "uploadFile",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]