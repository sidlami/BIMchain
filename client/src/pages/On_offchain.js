import React, {useEffect, useState} from 'react';
import Web3 from 'web3';
import axios from'axios';
import qs from 'qs';
import {ADRESS, ABI} from '../config.js'; //importing the ganache truffle address of deployed smart contract as well as the abi of the smart contract

function On_offchain() {

  //state variables
  const [onchainSmartContract, setOnchainSmartContract] = useState(null) //holds the ethereum smart contract
  const [personalBIMmodels, setPersonalBIMmodels] = useState([]) //holds the onchain stored URN of all user's personal offchain bim models in the frontend
  const [toBeUploadedModel, setToBeUploadedModel] = useState(null) //holds the path to the file which the user wants to upload
  const [fileName, setFileName] = useState() //holds the name of the to be uploaded file
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

        //estimate gas cost of calling all OSS keys stored on ethereum
        const estimatedGas = await smartCon.methods.getOffchainModels().estimateGas()
        var estimated_gas_per_key = estimatedGas/personalOffchainmodels.length
        console.log("Interpolated estimated gas needed for calling one OSS key stored on ethereum:", estimated_gas_per_key )

        //compute performance time of calling aka "downloading" key of all OffchainModels
        var performance_time_per_key = (end.getTime() - start.getTime())/personalOffchainmodels.length
        console.log("measured performance time for calling one OSS key stored on ethereum (in ms):", performance_time_per_key)

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
    setFileName(file.name)
    setToBeUploadedModel(file)
    /*const reader = new window.FileReader()
    reader.readAsBinaryString(file)
    reader.onloadend = () => {
      setToBeUploadedModel(reader.result)
    }*/
  }
  
  const upload = async () => {
    try {
      console.log("to be uploaded model:", toBeUploadedModel)

      //authenticate to autodesk's forge app
      const token = await authenticateToForge()

      //upload file to OSS bucket of model derivative api
      var end, start;
      start = new Date();
      const upload = await axios.put(
        `https://developer.api.autodesk.com/oss/v2/buckets/test_bim_models/objects/${fileName}.ifc`,
        toBeUploadedModel,
        {
          headers : {
            Authorization : `Bearer ${token}`
          }
        }
      )
      end = new Date();
      console.log("response from upload to OSS", upload)

      //encode objectId of model in OSS bucket using base 64 
      const ossId = btoa(upload.data.objectId)
      console.log("object id:", upload.data.objectId, "encoded object id:", ossId)

      //translate model inside OSS bucket to SVF
      const translation = await axios.post(
        'https://developer.api.autodesk.com/modelderivative/v2/designdata/job',
        JSON.stringify({
          input: {
            urn: ossId,
          },
          output: {
              destination: {
                region: "us"
              },
              formats: [
                  {
                      type : "svf",
                      views: [
                          "2d",
                          "3d"
                      ],
                      advanced: {
                        generateMasterViews: true
                      }
                  }
              ]
          }
        }),
        {
          headers : {
            Authorization : `Bearer ${token}`,
            //'x-ads-force' : true,
            "Content-type": "application/json",
          }
        }
      )
      console.log("translation job:", translation)

      //check if translation of model to svf was successful
      var successful_translation = false
      
      var translation_job =  await axios.get(
        `https://developer.api.autodesk.com/modelderivative/v2/designdata/${ossId}/manifest`,
        {
          headers : {
            Authorization : `Bearer ${token}`
          }
        }
      )

      while(translation_job.data.status === 'pending' || translation_job.data.status === 'inprogress'){
        translation_job =  await axios.get(
          `https://developer.api.autodesk.com/modelderivative/v2/designdata/${ossId}/manifest`,
          {
            headers : {
              Authorization : `Bearer ${token}`
            }
          }
        )
        console.log("translation progress:", translation_job.data.progress)
      }

      if(translation_job.data.status === 'failed'){
        console.log("Error: translation of model into sfv format failed.", "response:", translation_job)
      }else{
        if(translation_job.data.status === 'timeout'){
          console.log("Timeout: translation of model into sfv format timed out.", "response:", translation_job)
        }else{
          successful_translation = true
          console.log("translation of model into sfv format was successful!", successful_translation)
        }
      }
      
      if(successful_translation){
        //write ossId on etheruem blockchain
        const receipt = await onchainSmartContract.methods.setOffchainModels(ossId).send({from : user})
        
        //check if write on etheruem was successfull and document measurement data in google sheets
        if(receipt){

          //compute performance time
          var performance_time = end.getTime() - start.getTime()

          //get size data on ethereum
          var file_size_eth = Buffer.byteLength(ossId)

          //get transaction's used gas amount
          //web3-documentation: https://web3js.readthedocs.io/en/v1.2.11/web3-eth.html#gettransactionreceipt
          var gas = receipt.gasUsed

          //summary measurement data to googlesheets
          const measurement_data = {
            "timestamp" : (new Date()).toString(),
            "method" : "on_off",
            "operation"	: "upload",
            "file_key" : ossId,
            "file_name" : fileName,
            "file_size_ipfs" : 0, //in bytes
            "file_size_oss" : upload.data.size, //in bytes
            "file_size_ethereum" : file_size_eth, //in bytes
            "gas"	: gas,
            "time" : performance_time, //in ms
          }
          console.log("measurement result:", measurement_data)

          //add measurement data to googlesheets
          /*
          await axios.post(
            'https://sheet.best/api/sheets/ee03ddbd-4298-426f-9b3f-f6a202a1b667',
            measurement_data  
          )*/

          //alert("view console to check measurement data of upload to CDE and CDE key to ethereum")
          //window.location.reload()
        }else{
          console.log("ERROR: No receipt received from write on ethereum!")
        }
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
          "file_size_ipfs" : 0,
          
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

        //alert("view console to check measurement data of upload to CDE and CDE key to ethereum")
        //window.location.reload()
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
      if(metadata !== null & properties !== null & properties.data.data.collection !== null){

        //print out model
        console.log("metadata:", metadata)
        console.log("guid:", metadata.data.data.metadata[0].guid)
        console.log("properties:", properties)
        
        //compute performance time
        var performance_time = end.getTime() - start.getTime()

        //compute size of the downloaded file in bytes
        var file_size  = Buffer.byteLength(JSON.stringify(metadata.data.data.metadata)) + Buffer.byteLength(JSON.stringify(properties.data.data.collection))

        //compute size of data on ethereum
        var file_size_eth = Buffer.byteLength(JSON.stringify(selectedURN))

        //summary measurement data to googlesheets
        const measurement_data = {
          "timestamp" : end.toString(),
          "method" : "on_off",
          "operation"	: "download",
          "file_key" : selectedURN,
          "file_name" : metadata.data.data.metadata[0].name,
          "file_size_ipfs" : 0, //in bytes
          "file_size_oss" : file_size, //in bytes
          "file_size_ethereum" : file_size_eth, //in bytes
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
        /*const newJsonBimModel = {
          "meta_data" : JSON.stringify(metadata),
          "geom_data" : JSON.stringify(properties)
        }

        //add new json bim model to folder: 'test_models_in_json'
        await axios.post("http://localhost:3001/api/file", {
          "file_name" : selectedURN,
          "newJsonBimModel" : newJsonBimModel
        })*/

      }else{
        console.log("ERROR: The download from OSS bucket via model derivative API failed!","If you just uploaded the BIM model to OSS, wait a little bit and download it later again!")
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
        <button type="button" onClick={upload}>Upload</button>
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
