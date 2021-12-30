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
export const ADRESS_IPFS = '0x35e116CcA9B645F2A97B50F776aFc5640093c022'

//ABI for onchain ipfs smart contract
export const ABI_IPFS = [
	{
		"inputs": [],
		"name": "getIPFSModels",
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
				"name": "_fileHash",
				"type": "string"
			}
		],
		"name": "uploadFile",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]

//address of smart contract for onchain ipfs on ganache
export const ADRESS_ONCHAIN100 = '0x35E4346d9B5edfcEBA67FE5729a85CD975E03C1C'

//ABI for onchain ipfs smart contract
export const ABI_ONCHAIN100 = [
	{
		"inputs": [],
		"name": "getOnchainModelKeys",
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
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_key",
				"type": "uint256"
			}
		],
		"name": "getOnchainModels",
		"outputs": [
			{
				"components": [
					{
						"components": [
							{
								"internalType": "string",
								"name": "data",
								"type": "string"
							}
						],
						"internalType": "struct Onchain100.MetaData",
						"name": "meta",
						"type": "tuple"
					},
					{
						"components": [
							{
								"internalType": "string",
								"name": "data",
								"type": "string"
							}
						],
						"internalType": "struct Onchain100.GeomData",
						"name": "geom",
						"type": "tuple"
					}
				],
				"internalType": "struct Onchain100.BIMmodel",
				"name": "",
				"type": "tuple"
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
				"name": "_meta",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_geom",
				"type": "string"
			}
		],
		"name": "setOnchainModels",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]