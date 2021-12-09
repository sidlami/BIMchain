//this file is needed so that web3 can interact with a smart contract
//note: once you change the smart contract you need to re-deploy it and get the new adress as well as abi

//the adress of smart contract on ganache (once you start ganache you manually need to change this value)
export const ADRESS = '0x23739eA9498F791E8131B36528210D25cbF96ebB' 

//the abi of a smart contract stores all functions and its relevant infromation, like input and output data type
export const ABI = [
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "hashedModel",
				"type": "uint256"
			}
		],
		"name": "getTokenizedModel",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
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
				"internalType": "uint256",
				"name": "hashedModel",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "tokenizedModel",
				"type": "string"
			}
		],
		"name": "setTokenizedModel",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "testCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]