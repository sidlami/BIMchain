import React, {useEffect, useState} from 'react';
import Web3 from 'web3';
import axios from'axios';
import moment from 'moment';
import qs from 'qs';
import {ADRESS_IPFS, ABI_IPFS } from '../config'; //importing the ganache truffle address of deployed smart contract as well as the abi of the smart contract

//Connectin to IPFS via infura
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values

function OnchainIPFS() {

  //state variables
  const [onchainSmartContract, setOnchainSmartContract] = useState(null) //holds the ethereum smart contract
  const [buffer, setBuffer] = useState(null) //holds the path to the file which the user wants to upload
  const [personalBIMmodels, setPersonalBIMmodels] = useState([]) //holds the onchain stored reference keys for personal bim models stored in IPFS
  const [user, setUser] = useState("") //holdes the wallet address of the user in the frontend
  const [fileName, setFileName] = useState() //holds the name of the to be uploaded file
  const [selectedKey, setSelectedKey] = useState("") //holdes the key of the personal BIM model stored in IPFS and selected by the user for perfoming the onchain computation or was selected fordownload

  //on mount
  useEffect(()=>{
    const test = async () => {
      try {
        //conenct to web3
        const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")

        //get user's wallet adress
        const accounts = await web3.eth.getAccounts()
        setUser(accounts[0])

        //connect to smart contract managing the IPFS storage method
        const smartCon = new web3.eth.Contract(ABI_IPFS, ADRESS_IPFS)
        setOnchainSmartContract(smartCon)

        //get all bim models stored in IPFS
        var end, start;
        start = new Date();
        const models = await smartCon.methods.getIPFSModels().call()
        end = new Date();
        setPersonalBIMmodels(models)

        //estimate gas cost of calling all IPFS keys stored on ethereum
        const estimatedGas = await smartCon.methods.getIPFSModels().estimateGas()
        console.log("Interpolated estimated gas needed for calling one IPFS key stored on ethereum:",estimatedGas/models.length)
    
        //compute performance time of calling aka "downloading" one IPFS key from ethereum
        var performance_time_per_key = (end.getTime() - start.getTime())/models.length
        console.log("measured performance time for calling one OSS key stored on ethereum (in ms):", performance_time_per_key)
      } catch (error) {
        console.log(error)
      }
    }
    test()
  }, [])
  
  //function which captures the inputed file before user uploads it to IPFS
  const captureFile = event => {
    event.preventDefault()
    const file = event.target.files[0]
    console.log(file)
    setFileName(file.name)
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

      if(receipt){
        //compute performance time of uploading to IPFS (measuring how long write on ethereum takes makes no sense as 1. higher payment = faster transaction and 2. user needs to confirm paymane, thus performance time would be depending on user's responsiveness)
        let performance_time = end.getTime() - start.getTime()

        //get size of the downloaded file in bytes
        var file_size = decentralFile.size
        var size_stored_on_eth = Buffer.byteLength(decentralFile.path)

        //get transaction's used gas amount
        //web3-documentation: https://web3js.readthedocs.io/en/v1.2.11/web3-eth.html#gettransactionreceipt
        var gas = receipt.gasUsed

        //summary measurement data to googlesheets
        const measurement_data = {
          "timestamp" : end.toString(),
          "method" : "onchain_ipfs",
          "operation"	: "upload",
          "file_key" : decentralFile.path,
          "file_name" : fileName,
          "file_size_ipfs" : file_size, //in bytes
          "file_size_oss" : 0, //in bytes
          "file_size_ethereum" : size_stored_on_eth, //in bytes
          "gas"	: gas,
          "time" : performance_time //in ms and only the upload to ipfs
        }
        
        console.log("measurement result:", measurement_data)

        //add measurement data to googlesheets
        /*
        await axios.post(
          'https://sheet.best/api/sheets/ee03ddbd-4298-426f-9b3f-f6a202a1b667',
          measurement_data  
        )*/

        //alert("view console to check measurement data of ipfs upload")
        //window.location.reload()
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

      if(file){
        //print out model as string
        console.log(file.data)

        //compute performance time
        var performance_time = end.getTime() - start.getTime()

        //get size of the downloaded file in bytes
        var file_size  = Buffer.byteLength(JSON.stringify(file.data))
        //compute size of data on ethereum
        var file_size_eth = Buffer.byteLength(JSON.stringify(selectedKey))

        //summary measurement data to googlesheets
        const measurement_data = {
          "timestamp" : end.toString(),
          "method" : "onchain_ipfs",
          "operation"	: "download",
          "file_key" : selectedKey,
          "file_name" : "",
          "file_size_ipfs" : file_size, //in bytes
          "file_size_oss" : 0, //in bytes
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

      }else{
        console.log("Error: Downloaded file from IPFS is empty!")
      }
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
      <button type="button" onClick={upload}>Upload</button>
        
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
            <button type="button" onClick={download}>Download</button>
        </div>   
      }
    </div>
  );
}

export default OnchainIPFS;