import React, {useEffect, useState} from 'react';
import Web3 from 'web3';
import axios from'axios';
import CryptoJS from 'crypto-js';
import qs from 'qs';
import {ADRESS, ABI} from '../config.js'; //importing the ganache truffle address of deployed smart contract as well as the abi of the smart contract

function Onchain() {

  //state variables
  const [ossBIMmodels, setOssBIMmodels] = useState([]) //holds the URNs of all offchain bim models stored in the OSS
  const [personalBIMmodels, setPersonalBIMmodels] = useState([]) //holds the onchain stored reference keys for personal bim models stored on IPFS
  const [user, setUser] = useState("") //holdes the wallet address of the user in the frontend
  const [selectedURN, setSelectedURN] = useState("") //holdes the URN of the personal BIM model which was selected by the user for perfoming the onchain computation
  const [uploadURN, setUploadURN] = useState("") //holdes the URN of the personal BIM model which was inputed by the user and should be uploaded to blockchain. this URN is created in the process of uploading the bim model to the OSS of the model derivative api

  //on mount
  useEffect(()=>{
    const test = async () => {
        try {

          //get the user
          const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")
          const accounts = await web3.eth.getAccounts()
          setUser(accounts[0])
      
          //authenticate
          const token = await authenticateToForge()
          console.log("token:", token)

          //get buckets
          /*
          const bucket = await axios.get(
            `https://developer.api.autodesk.com/oss/v2/buckets`, 
            {
                headers : {
                    Authorization: `Bearer ${token}`
                }
            }
          )
          console.log(bucket)
          */

          //get URN of all bim models stored in the OSS of autodesk forge
          //link: https://forge.autodesk.com/en/docs/data/v2/reference/http/buckets-:bucketKey-objects-GET/
          const bucketKey = 'test_bim_models'

          const models = await axios.get(
            `https://developer.api.autodesk.com/oss/v2/buckets/${bucketKey}/objects`, 
            {
              headers : {
                  Authorization: `Bearer ${token}`
              }
            }
          )
  
          var urns = []
          for(var i = 0; models.data.items.length; i++){
              console.log(models.data.items[i].objectId)
              urns.push(CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(models.data.items[i].objectId)))
          }
          console.log("URNs in OSS Bucket", urns)
          setOssBIMmodels(urns)
  
          //get all bim models stored in IPFS/filecoin
          
    
            
        } catch (error) {
            console.log(error)
        }
    }
    test()

    /*
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

      //load in the URN of all user's personal bim models
      try{

        //get URN of all personal bim models stored on blockchain
        // --> THIS IS DOWNLOADING ALL OF THE ONCHAIN PARTs OF THE OFFCHAIN BIM MODELS AT THE SAME TIME
        // --> this is the download in an on- and offchain architecture, meaning there is no transaction fee for performing a call
        const personalOffchainmodels = await smartCon.methods.getOffchainModels().call()

        //store personal bim models in frontend
        setPersonalBIMmodels(personalOffchainmodels)

        //print personal bim models to console
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
      }catch(e){
        console.log(e)
      }
    }
    test()
    */
  }, [])

  //function for authenticating to autodesk forge app, returns token 
  const authenticateToForge = async () => {
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

  //function uploads bim model from OSS to IPFS/filecoin
  const upload = async () => {
    console.log(selectedURN)
    /*try{
      const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")
      const smartCon = new web3.eth.Contract(ABI, ADRESS)
      await smartCon.methods.setOffchainModels(uploadURN).send({from : user})
    }catch(e){
      console.log(e)
    }*/
  }

  //function downloads bim model from IPFS/filecoin and loads it into frontend
  const download = async () => {
    console.log(selectedURN)
    /*
    try{
      const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")
      const smartCon = new web3.eth.Contract(ABI, ADRESS)
      await smartCon.methods.setOffchainModels(uploadURN).send({from : user})
    }catch(e){
      console.log(e)
    }*/
  }

  /*
  //function retrieves data from OSS bucket, transforms the property data 
  //and passes the data to blockchain for further computation
  const compute = async () => {
    console.log("selected urn:", selectedURN)
    try{
      //1. authenticate
      const token = await authenticateToForge()
      console.log("token:",token)

      //2. get URN from onchain and thus ensuring valid usage of bim model
      //--> user selects URN and frontend stores in variable: selectedURN

      //3. get metadata based on the selected URN stored in variable: selectedURN 
      const metadata = await axios.get(
        `https://developer.api.autodesk.com/modelderivative/v2/designdata/${selectedURN}/metadata`, 
        {
          headers : {
            Authorization: `Bearer ${token}`
          }
        }
      )
      console.log("metadata:", metadata)
      
      //4. extract model guid from meta data
      const guid = metadata.data.data.metadata[0].guid
      console.log("guid:", metadata.data.data.metadata[0].guid)
      
      //5. get properties based on urn 
      const properties = await axios.get(
        `https://developer.api.autodesk.com/modelderivative/v2/designdata/${selectedURN}/metadata/${guid}/properties`, 
        {
          headers : {
            Authorization: `Bearer ${token}`
          }
        }
      )
      console.log("properties:", properties)

      //6. transform property data into a predefined struct so that solidity can work with the data
      //this is the interesting interface between onchain bim model data and offchain usage of this data

      
      //7. send properties to memory of smart contract which then performs the onchain computation
      const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")
      const smartCon = new web3.eth.Contract(ABI, ADRESS)
      //await smartCon.methods.setOffchainModels().send({from : user})

      //8. printout onchain cpomputation result + performance aka cost
      
    }catch(e){
      console.log(e)
    }
  }*/

  return (
    <div>
      <p>
        This page tests the possibility to store BIM models through filecoin in an IPFS.
      </p>
      <h4>Uploadable BIM models:</h4>
      {ossBIMmodels.length === 0 ?
        <p>There are no uploadable bim models in the OSS bucket!</p>
        :
        <div>
          <label htmlFor="select-model">Select your personal offchain BIM model to compute onchain: </label>
          <select name="select-model" value={selectedURN} onChange={(e)=>setSelectedURN(e.target.value)}>
            <option value="" disabled hidden>Choose here</option>
            {
              ossBIMmodels.map(item =>{
                return(
                  <option key ={item} value={item}>
                    {item}
                  </option>
                )
              }) 
            }
          </select>
          <button type="button">Upload</button>
        </div>     
      }

        
        <h4>Your onchain BIM models:</h4>
        {personalBIMmodels.length === 0 ?
            <p>You currently do not possess any onchain BIM models in the IPFS on your account: '{user}' according to the Ethereum Blockchain!</p>
            :
            <div>
            <label htmlFor="select-model">Select your personal offchain BIM model to compute onchain: </label>
            <select name="select-model" value={selectedURN} onChange={(e)=>setSelectedURN(e.target.value)}>
                <option value="" disabled hidden>Choose here</option>
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
    </div>
  );
}

export default Onchain;