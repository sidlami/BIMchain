
import './App.css';
import React, {useEffect, useState} from 'react';
import Web3 from 'web3';
import axios from'axios';
import qs from 'qs';
import {ADRESS, ABI} from './config.js'; //importing the ganache truffle address of deployed smart contract as well as the abi of the smart contract

async function authenticateToForge(){
  try{
    var data = qs.stringify({
      'grant_type': 'client_credentials',
      'client_id': 'XLzyTeEl6Mbl8sWYkALaryGC9g6yUDi7',
      'client_secret': 'RptOywJiF7ZPWJMH',
      'scope': 'data:read data:write data:create bucket:read bucket:create'
    });

    const token = await axios.post(
      "https://developer.api.autodesk.com/authentication/v1/authenticate",
      data,
      {
        headers: {
          "Content-Type" : "application/x-www-form-urlencoded"
        }
      }
    )

    return token.data.access_token
  }catch(e){
    return e
  }
}

function App() {

  //state variables
  const [personalBIMmodels, setPersonalBIMmodels] = useState([]) //stores the URN of all user's personal offchain bim models
  const [user, setUser] = useState("") //stores the wallet address of the user in the frontend
  const [selectedURN, setSelectedURN] = useState("") //stores the URN of the personal BIM model which should be used for onchain computation
  const [uploadURN, setUploadURN] = useState("") //stores the URN of the personal BIM model which should be uploaded to the OSS (=CDE)

  //on mount
  useEffect(()=>{
    async function test(){
      const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")
      const network = await web3.eth.net.getNetworkType()
      const accounts = await web3.eth.getAccounts()
      setUser(accounts[0])
      console.log("network:", network)
      console.log("account:", accounts[0])

      //video 2: https://www.dappuniversity.com/articles/ethereum-dapp-react-tutorial
      const smartCon = new web3.eth.Contract(ABI, ADRESS)
      console.log("SmartContract", smartCon)

      //test connection to smart contract
      const issuerContract = await smartCon.methods.owner().call()
      console.log("issuer of smart contract: ", issuerContract)

      //load in all of the user's personal bim models hashed value keys
      try{
        //1. authenticate and get token to use forge
        var data = qs.stringify({
          'grant_type': 'client_credentials',
          'client_id': 'XLzyTeEl6Mbl8sWYkALaryGC9g6yUDi7',
          'client_secret': 'RptOywJiF7ZPWJMH',
          'scope': 'data:read data:write data:create bucket:read bucket:create'
        });
        const token = await axios.post(
          "https://developer.api.autodesk.com/authentication/v1/authenticate",
          data,
          {
            headers: {
              "Content-Type" : "application/x-www-form-urlencoded"
            }
          }
        )
        console.log("forge token:", token.data.access_token)

        //2. get URN of all personal bim models stored on blockchain
        // --> THIS IS DOWNLOADING ALL OF THE ONCHAIN PARTs OF THE OFFCHAIN BIM MODELS AT THE SAME TIME
        // --> this is the download in an on- and offchain architecture, meaning there is no transaction fee for performing a call
        const personalOffchainmodels = await smartCon.methods.getOffchainModels().call()

        setPersonalBIMmodels(personalOffchainmodels)

        if(personalOffchainmodels?.length !== 0){

          for(var i=0; i < personalOffchainmodels.length; i++){
            if(i === 0 ){
              console.log("personal offchain BIM models:")
            }
            console.log("offchain bim model number "+i+": "+personalOffchainmodels[i])
          }
        }else{
          console.log("You currently do not possess any offchain bim models!")
        }

        //3. get all GUID of one personal bim model from offchain storage (=OSS of autodesk forge) based on URN of bim model
        //lazy load in all values of mapping variable
        /*for(var i = 0; i < personalBIMmodels.length; i++){
          
        }*/
      }catch(e){
        console.log(e)
      }
    }
    test()
  }, [])

  const upload = async () => {
    console.log(uploadURN)
    try{
      const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")
      const smartCon = new web3.eth.Contract(ABI, ADRESS)
      await smartCon.methods.setOffchainModels(uploadURN).send({from : user})
    }catch(e){
      console.log(e)
    }
  }

  return (
    <div className="App">
      <h1>Willkommen zu BIMchain</h1>
      <p>
        This DApp functions as a prototype for testing the possibilities to store BIM models on the ethereum blockchain.
      </p>
    
      <h3>Your offchain BIM models</h3>
      {personalBIMmodels.length === 0 ?
        <p>You currently do not possess any offchain BIM models on your account: '{user}' according to the Ethereum Blockchain!</p>
        :
        <div>
          <label htmlFor="select-model">Select your personal offchain BIM model to compute onchain: </label>
          <select name="select-model" value={selectedURN} onChange={(e)=>setSelectedURN(e.target.value)}>
            <option value="" selected disabled hidden>Choose here</option>
            {
              personalBIMmodels.map(item =>{
                return(
                  <option key ={item} value={item}>
                    {item}
                  </option>
                )
              }) 
            }
          </select>
          <button type="button">Compute on chain</button>
          <button type="button">Download</button>
        </div>    
      }

      <h3>Upload your BIM model</h3>
      <label htmlFor="urn">URN of the personal BIM model you want to store on- and offchain: </label>
      <input type="text" name="urn" size="10" value={uploadURN} onChange={(e)=>setUploadURN(e.target.value)}/>
      <button type="button" onClick={upload}>Upload</button>
    </div>
  );
}

export default App;
