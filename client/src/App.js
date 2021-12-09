
import './App.css';
import React, {useEffect, useState} from 'react';
import Web3 from 'web3';
import {ADRESS, ABI} from './config.js' //importing the ganache truffle address of deployed smart contract

function App() {

  //state variables
    //const [personalBIMmodels, setPersonalBIMmodels] = useState([])

  //on mount
  useEffect(()=>{
    async function test(){
      const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")
      const network = await web3.eth.net.getNetworkType()
      const accounts = await web3.eth.getAccounts()
      console.log("network:", network)
      console.log("account:", accounts[0])

      //video 2: https://www.dappuniversity.com/articles/ethereum-dapp-react-tutorial
      const smartCon = new web3.eth.Contract(ABI, ADRESS)
      console.log("SmartContract", smartCon)

      //test connection to smart contract
      const issuerContract = await smartCon.methods.owner().call()
      console.log("issuer of smart contract: ", issuerContract)

      //load in all of the user's personal bim models hashed value keys
        const personalBIMmodels = []

      //lazy load in all values of mapping variable
      for(var i = 0; i < personalBIMmodels.length; i++){
        
      }
    }
    test()
  })

  return (
    <div className="App">
      <h1>Willkommen zu BIMchain</h1>
      <p>
        Diese DApp dient zur Testung der Speicherungsmethoden von BIM Modellen auf der Ethereum Blockchain!
      </p>
    </div>
  );
}

export default App;
