//this file is needed so that web3 can interact with a smart contract
//note: once you change the smart contract you need to re-deploy it and get the new adress as well as abi

//the adress of smart contract on ganache (once you start ganache you manually need to change this value)
export const ADRESS = '0xD9F54E143809cBD5AaA2E2b35c3D0a2a33ad1C6D' 

//the abi of a smart contract stores all functions and its relevant infromation, like input and output data type
export const ABI = [
	{
		"inputs": [],
		"name": "getOffchainModels",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
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
				"name": "urn_new_offchain_model",
				"type": "uint256"
			}
		],
		"name": "setOffchainModels",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]