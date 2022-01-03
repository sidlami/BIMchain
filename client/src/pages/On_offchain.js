import React, {useEffect, useState} from 'react';
import Web3 from 'web3';
import axios from'axios';
import qs from 'qs';
import {ADRESS, ABI} from '../config.js'; //importing the ganache truffle address of deployed smart contract as well as the abi of the smart contract

function On_offchain() {

  //state variables
  const [onchainSmartContract, setOnchainSmartContract] = useState(null) //holds the ethereum smart contract
  const [personalBIMmodels, setPersonalBIMmodels] = useState([]) //holds the onchain stored URN of all user's personal offchain bim models in the frontend
  const [buffer, setBuffer] = useState(null) //holds the path to the file which the user wants to upload
  const [file_name, setFile_name] =  useState("") //holds the name for the file which the user wants to upload to OSS
  const [user, setUser] = useState("") //holdes the wallet address of the user in the frontend
  const [selectedURN, setSelectedURN] = useState("") //holdes the URN of the personal BIM model which was selected by the user for perfoming the onchain computation
  const [uploadURN, setUploadURN] = useState("") //holdes the URN of the personal BIM model which was inputed by the user and should be uploaded to blockchain. this URN is created in the process of uploading the bim model to the OSS of the model derivative api

  //on mount
  useEffect(()=>{
    async function test(){
      try{
        const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")
        const network = await web3.eth.net.getNetworkType()
        const accounts = await web3.eth.getAccounts()
        setUser(accounts[0])
        console.log("network:", network)

        //video 2: https://www.dappuniversity.com/articles/ethereum-dapp-react-tutorial
        const smartCon = new web3.eth.Contract(ABI, ADRESS)
        setOnchainSmartContract(smartCon)

        //load in the URN of all user's personal bim models
        //get URN of all personal bim models stored on blockchain
        // --> THIS IS DOWNLOADING ALL OF THE ONCHAIN PARTs OF THE OFFCHAIN BIM MODELS AT THE SAME TIME
        // --> this is the download in an on- and offchain architecture, meaning there is no transaction fee for performing a call
        var end, start;
        start = new Date();
        const personalOffchainmodels = await smartCon.methods.getOffchainModels().call()
        end = new Date();

        //compute performance time of downloading OffchainModels
          //var performance_time = end.getTime() - start.getTime()
          //console.log("measured performance time for download of all offchain model's ID (in ms):", performance_time)

        //store personal bim models in frontend
        setPersonalBIMmodels(personalOffchainmodels)

      }catch(e){
        console.log(e)
      }
    }
    test()
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

  //function which captures the inputed file before user uploads it to IPFS
  const captureFile = event => {
    event.preventDefault()
    const file = event.target.files[0]
    console.log("caputred file:", file)
    //setBuffer(file)
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      setBuffer(Buffer(reader.result))
    }
  }
  
  const upload = async () => {
    try {
      console.log("to be uploaded buffer", buffer)

      //1. authenticate
      const token = await authenticateToForge()

      //2. upload file to OSS
      const upload = await axios.put(
        `https://developer.api.autodesk.com/oss/v2/buckets/test_bim_models/objects/${file_name}.ifc`,
        buffer,
        {
          headers : {
            Authorization : `Bearer ${token}`
          }
        }
      )
      console.log("response from upload to OSS", upload)

      //3. encode objectId base 64
      const ossId = btoa(upload.data.objectId)
      console.log("object id:", upload.data.objectId, "encoded object id:", ossId)

      //4. write ossId on etheruem blockchain
      const receipt = await onchainSmartContract.methods.setOffchainModels(ossId).send({from : user})
      
      //5. check if write on etheruem was successfull and document measurement data in google sheets
      if(receipt){

        //get size of the downloaded file in bytes
        var file_size = Buffer.byteLength(ossId)

        //get transaction's used gas amount
        //web3-documentation: https://web3js.readthedocs.io/en/v1.2.11/web3-eth.html#gettransactionreceipt
        var gas = receipt.gasUsed

        //summary measurement data to googlesheets
        const measurement_data = {
          "timestamp" : (new Date()).toString(),
          "method" : "on_off",
          "operation"	: "upload",
          "file_key" : ossId,
          "file_size"	: upload.data.size+" (OSS bucket) + "+file_size+" (on-chain)", //bytes
          "gas"	: gas,
          "time" : "null" //in ms
        }
        console.log("measurement result:", measurement_data)

        //add measurement data to googlesheets
        /*
        await axios.post(
          'https://sheet.best/api/sheets/ee03ddbd-4298-426f-9b3f-f6a202a1b667',
          measurement_data  
        )*/

        alert("view console to check measurement data of upload to CDE and CDE key to ethereum")
        window.location.reload()
      }else{
        console.log("ERROR: No receipt received from write on ethereum!")
      }

    } catch (error) {
      console.log(error)
    }
  }

  //function uploads URN string to blockchain (note: costs occure)
  const upload_final = async () => {
    try{
      const receipt = await onchainSmartContract.methods.setOffchainModels(uploadURN).send({from : user})
      if(receipt){

        //get size of the downloaded file in bytes
        var file_size = Buffer.byteLength(uploadURN)

        //get transaction's used gas amount
        //web3-documentation: https://web3js.readthedocs.io/en/v1.2.11/web3-eth.html#gettransactionreceipt
        var gas = receipt.gasUsed
        console.log("Onchain100 upload used gas amount:", gas)

        //summary measurement data to googlesheets
        const measurement_data = {
          "timestamp" : (new Date()).toString(),
          "method" : "on_off",
          "operation"	: "upload",
          "file_key" : uploadURN,
          "file_size"	: file_size, //bytes
          "gas"	: gas,
          "time" : "null" //in ms
        }
        console.log("measurement result:", measurement_data)

        //add measurement data to googlesheets
        /*
        await axios.post(
          'https://sheet.best/api/sheets/ee03ddbd-4298-426f-9b3f-f6a202a1b667',
          measurement_data  
        )*/

        alert("view console to check measurement data of upload to CDE and CDE key to ethereum")
        window.location.reload()
      }else{
        console.log("ERROR: No receipt received from write on ethereum!")
      }
    }catch(e){
      console.log(e)
    }
  }

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
      //await onchainSmartContract.methods.setOffchainModels().send({from : user})

      //8. printout onchain cpomputation result + performance aka cost
      
    }catch(e){
      console.log(e)
    }
  }

  //function downloads bim model from CDE and loads it into frontend
  const download = async () => {
    try {
      
      //1. authenticate
      const token = await authenticateToForge()

      //2. get URN from onchain and thus ensuring valid usage of bim model
      //--> user selects URN and frontend stores in variable: selectedURN

      //3. get metadata based on the selected URN stored in variable: selectedURN 
      var start = new Date();
      const metadata = await axios.get(
        `https://developer.api.autodesk.com/modelderivative/v2/designdata/${selectedURN}/metadata`, 
        {
          headers : {
            Authorization: `Bearer ${token}`
          }
        }
      )
      
      //4. extract model guid from meta data
      const guid = metadata.data.data.metadata[0].guid
     
      //5. get properties based on urn 
      const properties = await axios.get(
        `https://developer.api.autodesk.com/modelderivative/v2/designdata/${selectedURN}/metadata/${guid}/properties`, 
        {
          headers : {
            Authorization: `Bearer ${token}`
          }
        }
      )
      var end = new Date();
      
      //check if model is how it should be
      if(metadata !== null & properties !== null){

        //print out model
        console.log("metadata:", metadata)
        console.log("guid:", metadata.data.data.metadata[0].guid)
        console.log("properties:", properties)
        
        //compute performance time
        var performance_time = end.getTime() - start.getTime()

        //compute size of the downloaded file in bytes
        var file_size  = Buffer.byteLength(JSON.stringify(metadata)) + Buffer.byteLength(JSON.stringify(properties))

        //summary measurement data to googlesheets
        const measurement_data = {
          "timestamp" : end.toString(),
          "method" : "on_off",
          "operation"	: "download",
          "file_key" : selectedURN,
          "file_size"	: file_size, //bytes
          "gas"	: 0,
          "time" : performance_time //in ms
        }
        
        console.log("measurement result:", measurement_data)

        //add measurement data to googlesheets
        /*
        await axios.post(
          'https://sheet.best/api/sheets/ee03ddbd-4298-426f-9b3f-f6a202a1b667',
          measurement_data  
        )*/

        //create json file out of meta data and geometry data (aka properties)
        const newJsonBimModel = {
          "meta_data" : JSON.stringify(metadata),
          "geom_data" : JSON.stringify(properties)
        }

        //add new json bim model to folder: 'test_models_in_json'
        await axios.post("http://localhost:3001/api/file", {
          "file_name" : selectedURN,
          "newJsonBimModel" : newJsonBimModel
        })

      }else{
        console.log("ERROR: The download from OSS bucket via model derivative API failed!")
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div>
        <p>Dear user: {user},</p>
        <p>
            This page tests the possibility to store BIM models offchain in a CDE (or here: an OSS bucket of an autodesk froge app) and the URN of these models.
        </p>
        <h4>Upload your BIM model to OSS bucket</h4>
        <label htmlFor='input-file'>Select and upload bim model: </label>
        <input name='input-file' type="file" onChange={captureFile}/>
        {buffer ? 
          <div>
            <label htmlFor='input-file'>Name bim model for OSS bucket: </label>
            <input type="text" name="urn" size="10" value={file_name} onChange={(e)=>setFile_name(e.target.value)}/>.ifc
          </div>
          : ""
        }
        {file_name ? <button type="button" onClick={upload}>Upload</button> : ""}
        <h4>Your offchain BIM models:</h4>
        {personalBIMmodels.length === 0 ?
            <p>You currently do not possess any offchain BIM models on your account: '{user}' according to the Ethereum Blockchain!</p>
            :
            <div>
              <label htmlFor="select-model">Select your personal offchain BIM model to compute onchain: </label>
              <select name="select-model" value={selectedURN} onChange={(e)=>setSelectedURN(e.target.value)}>
                  <option value="" disabled hidden>Choose here</option>
                  {
                  personalBIMmodels.map((item, key) =>{
                      return(
                      <option key ={key} value={item}>
                          {item}
                      </option>
                      )
                  }) 
                  }
              </select>
              <button type="button" onClick={compute}>Compute on chain</button>
              <button type="button" onClick={download}>Download</button>
            </div>    
        }
    </div>
  );
}

export default On_offchain;
