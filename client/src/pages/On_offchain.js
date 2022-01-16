import React, {useEffect, useState} from 'react';
import Web3 from 'web3';
import axios from'axios';
import qs from 'qs';
import {ADRESS, ABI} from '../config.js'; //importing the ganache truffle address of deployed smart contract as well as the abi of the smart contract

function On_offchain(props) {

  //state variables
  const [onchainSmartContract, setOnchainSmartContract] = useState(null) //holds the ethereum smart contract
  const [personalBIMmodels, setPersonalBIMmodels] = useState([]) //holds the onchain stored URN of all user's personal offchain bim models in the frontend
  const [toBeUploadedModel, setToBeUploadedModel] = useState(null) //holds the path to the file which the user wants to upload
  const [fileName, setFileName] = useState() //holds the name of the to be uploaded file
  const [user, setUser] = useState("") //holdes the wallet address of the user in the frontend
  const [selectedURN, setSelectedURN] = useState("") //holdes the URN of the personal BIM model which was selected by the user for perfoming the onchain computation
  const [uploadURN, setUploadURN] = useState("") //holdes the URN of the personal BIM model which was inputed by the user and should be uploaded to blockchain. this URN is created in the process of uploading the bim model to the OSS of the model derivative api

  const [extraDownloadGas, setExtraDownloadGas] = useState(0) //holds the interpolated value of gas cost per downloaded OSS key
  const [extraDownloadTime, setExtraDownloadTime] = useState(0) //holds the interpolated value of time per downloaded OSS key

  //on mount
  useEffect(()=>{
    async function test(){
      try{
        //connect to web3 library which is essential for communicating with on-chain smart contracts
        const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")

        //get active adress of user (e.g. metamask wallet adress)
        const accounts = await web3.eth.getAccounts()
        setUser(accounts[0])

        //connect via web3 to the smart contract managing the on- and off-chain storing 
        const smartCon = new web3.eth.Contract(ABI, ADRESS)
        setOnchainSmartContract(smartCon)

        //load in the OSS key of all user's personal bim models. 
        //All OSS keys are stored on Ethereum.
        //OSS keys are needed to find user's personal bim models uploaded to OSS.
        //OSS represents a CDE.
        var end, start;
        start = new Date();
        const personalOffchainmodels = await smartCon.methods.getOffchainModels().call()
        end = new Date();
        setPersonalBIMmodels(personalOffchainmodels)

        //estimate gas cost of calling all OSS keys stored on ethereum
        const estimatedGas = await smartCon.methods.getOffchainModels().estimateGas()
        const estimated_gas_per_key = estimatedGas/personalOffchainmodels.length //interpolate estimated gas cost per key downloaded from ethereum
        setExtraDownloadGas(estimated_gas_per_key)
        console.log("Interpolated estimated gas needed for calling one OSS key stored on ethereum:", estimated_gas_per_key )

        //compute performance time of calling aka "downloading" one OSS key from ethereum
        const performance_time_per_key = (end.getTime() - start.getTime())/personalOffchainmodels.length
        setExtraDownloadTime(performance_time_per_key)
        console.log("measured performance time for calling one OSS key stored on ethereum (in ms):", performance_time_per_key)
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

  //function which captures the inputed file before user uploads it to OSS
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
        `https://developer.api.autodesk.com/oss/v2/buckets/test_bim_models/objects/${fileName}`,
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

      //check if model's translation to svf was successful
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

      //assess status of finished check on successfullness of translation job
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
            "gas_write"	: gas,
            "gas_read" : 0,
            "time" : performance_time, //in ms
            "extra_time" : 0,
          }
          console.log("measurement result:", measurement_data)

          //add measurement data to googlesheets if testing mode activated
          if(props.testing){
            await axios.post(
              'https://sheet.best/api/sheets/ee03ddbd-4298-426f-9b3f-f6a202a1b667',
              measurement_data  
            )
          }
          
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

  //function downloads bim model from CDE and loads it into frontend
  const download = async () => {
    try {
      
      //authenticate
      const token = await authenticateToForge()

      //get URN from onchain and thus ensuring valid usage of bim model
      //--> user selects URN and frontend stores in variable: selectedURN

      //get metadata based on the selected URN stored in variable: selectedURN 
      var start = new Date();
      const metadata = await axios.get(
        `https://developer.api.autodesk.com/modelderivative/v2/designdata/${selectedURN}/metadata`, 
        {
          headers : {
            Authorization: `Bearer ${token}`
          }
        }
      )
      
      //extract model guid from meta data
      const guid = metadata.data.data.metadata[0].guid
     
      //get properties based on selected urn and guid
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
          "gas_write"	: 0,
          "gas_read" : extraDownloadGas,
          "time" : performance_time, //in ms
          "extra_time" : extraDownloadTime //in ms
        }
        
        console.log("measurement result:", measurement_data)

        //add measurement data to googlesheets
        if(props.testing){
          await axios.post(
            'https://sheet.best/api/sheets/ee03ddbd-4298-426f-9b3f-f6a202a1b667',
            measurement_data  
          )
        }
      }else{
        console.log("ERROR: The download from OSS bucket via model derivative API failed!","If you just uploaded the BIM model to OSS, wait a little bit and download it later again!")
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div >
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
              <button type="button" onClick={download}>Download</button>
            </div>    
        }
    </div>
  );
}

export default On_offchain;
