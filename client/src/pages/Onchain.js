import React, {useEffect, useState} from 'react';
import Web3 from 'web3';
import axios from'axios';
import moment from 'moment';
import qs from 'qs';
import {ADRESS_IPFS, ABI_IPFS } from '../config'; //importing the ganache truffle address of deployed smart contract as well as the abi of the smart contract

//Connectin to IPFS via infura
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values

function Onchain() {

  //state variables
  const [web3, setWeb3] = useState(null)
  const [onchainSmartContract, setOnchainSmartContract] = useState(null) //holds the ethereum smart contract
  const [buffer, setBuffer] = useState(null) //holds the path to the file which the user wants tu upload
  const [personalBIMmodels, setPersonalBIMmodels] = useState([]) //holds the onchain stored reference keys for personal bim models stored in IPFS
  const [user, setUser] = useState("") //holdes the wallet address of the user in the frontend
  const [selectedKey, setSelectedKey] = useState("") //holdes the key of the personal BIM model stored in IPFS and selected by the user for perfoming the onchain computation or was selected fordownload

  //on mount
  useEffect(()=>{
    const test = async () => {
      try {
        //conenct to web3
        const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")

        //get user's wallet adress
        const account = await web3.currentProvider.selectedAddress;
        setUser(account)

        //connect to smart contract managing the IPFS storage method
        const smartCon = new web3.eth.Contract(ABI_IPFS, ADRESS_IPFS)
        setOnchainSmartContract(smartCon)

        //get all bim models stored in IPFS
        const models = await smartCon.methods.getIPFSModels().call()
        setPersonalBIMmodels(models)
    
        //authenticate to autodesk forge
        /*const token = await authenticateToForge()
        console.log("token:", token)

        //get buckets
        
        const bucket = await axios.get(
          `https://developer.api.autodesk.com/oss/v2/buckets`, 
          {
              headers : {
                  Authorization: `Bearer ${token}`
              }
          }
        )
        console.log(bucket)
        

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
        setOssBIMmodels(urns)*/
          
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
  
  //function which captures the inputed file before user uploads it to IPFS
  const captureFile = event => {
    event.preventDefault()
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      setBuffer(Buffer(reader.result))
    }
  }

  //function uploads bim model to IPFS and stores the key on ethereum
  //https://www.youtube.com/watch?v=pTZVoqBUjvI&t=1320s
  const upload = async () => {
    try {
      var end, start;
      start = new Date();
      const decentralFile = await ipfs.add(buffer) // Adding file inside state variable 'buffer' to IPFS using the IPFS connection from above
      end = new Date();

      //store the key (aka cid) to the files in IPFS on the ethereum blockchain
      const receipt = await onchainSmartContract.methods.uploadFile(decentralFile.path).send({from:user})

      if(receipt & decentralFile){
        //compute performance time of uploading to IPFS (measuring how long write on ethereum takes makes no sense as 1. higher payment = faster transaction and 2. user needs to confirm paymane, thus performance time would be depending on user's responsiveness)
        let performance_time = end.getTime() - start.getTime()

        //get size of the downloaded file in bytes
        var file_size  = decentralFile.size

        //get transaction's used gas amount
        //web3-documentation: https://web3js.readthedocs.io/en/v1.2.11/web3-eth.html#gettransactionreceipt
        var gas = receipt.gasUsed

        //summary measurement data to googlesheets
        const measurement_data = {
          "timestamp" : end.toString(),
          "method" : "onchain_ipfs",
          "operation"	: "upload",
          "file_key" : decentralFile.path,
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

        alert("view console to check measurement data of ipfs upload")

        window.location.reload()
      }
    } catch (error) {
      console.log(error)
    }
  }

  //function downloads bim model from IPFS and loads it into frontend
  const download = async () => {
    try {
      var end, start;
      start = new Date();
      const file = await axios.get("https://ipfs.infura.io/ipfs/" + selectedKey)
      end = new Date();

      //check if bim model is how it should be
      if(file.headers["content-type"] === 'application/json'){

        //print out model
        console.log("downloaded bim model from ipfs")
        console.log("meta data:", file.data.meta_data)
        console.log("geom data:", file.data.geom_data)

        //compute performance time
        var performance_time = end.getTime() - start.getTime()

        //get size of the downloaded file in bytes
        var file_size  = Buffer.byteLength(JSON.stringify(file.data))

        //summary measurement data to googlesheets
        const measurement_data = {
          "timestamp" : end.toString(),
          "method" : "onchain_ipfs",
          "operation"	: "download",
          "file_key" : selectedKey,
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

      }else{
        console.log("ERROR: The downloaded file is not a BIM model in JSON format!")
      }
    } catch (error) {
      console.log(error)
    }
  }

  const compute = async () =>{
    try {
      const file = await axios.get("https://ipfs.infura.io/ipfs/" + selectedKey)

      if(file.headers["content-type"] === 'application/json'){
        const meta = file.data.meta_data
        const geom = file.data.geom_data

        //call onchain computation smart contract for computing 
          //onchainSmartContract.methods.compute(meta, geom).call() or send() ???
      }
      console.log(file)
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div>
      <p>Dear user: {user},</p>
      <p>
        This page tests the possibility to store BIM models in the Inter Planetary File System (IPFS). 
        It is common practice to use filecoin as an additonal layer on IPFS for an incentive to store files decentrally.
        This prototype, however, does not make use of it altough there are use cases for which it makes sense to use filecoin as well.
      </p>
      <h4>Upload your BIM model to IPFS:</h4>
      <label htmlFor='input-file'>Select and upload bim model: </label>
      <input name='input-file' type="file" onChange={captureFile}/>
      <button type="button"onClick={upload}>Upload</button>
        
      <h4>Your BIM models in IPFS:</h4>
      {personalBIMmodels.length === 0 ?
        <p>You currently do not possess any BIM models in IPFS on your account: '{user}' according to the Ethereum Blockchain!</p>
        :
        <div>
            <label htmlFor="select-model">Select your personal BIM model on Ethereum: </label>
            <select name="select-model" value={selectedKey} onChange={(e)=>setSelectedKey(e.target.value)}>
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
        /*<div>
          <label htmlFor="select-model">Select one of your BIM models in IPFS: </label>
          <select name="select-model" value={selectedURN} onChange={(e)=>setSelectedURN(e.target.value)}>
              <option value="" disabled hidden>Choose here</option>
              {
              personalBIMmodels.map(item =>{
                  return(
                  <option key ={item.fileHash} value={item.fileHash}>
                      {item.fileName+" ("+item.fileHash+")"}
                  </option>
                  )
              }) 
              }
          </select>
          <button type="button">Compute on chain</button>
          <button type="button">Download</button>
        </div>*/     
      }
    </div>
  );
}

export default Onchain;