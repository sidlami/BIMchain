import React, {useEffect, useState} from 'react';
import Web3 from 'web3';
import axios from'axios';
import moment from 'moment';
import qs from 'qs';
//import {ADRESS_100, ABI_100 } from '../config'; //importing the ganache truffle address of deployed smart contract as well as the abi of the smart contract

//Connectin to IPFS via infura
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values


function Onchain100() {

  //state variables
  const [onchainSmartContract, setOnchainSmartContract] = useState(null) //holds the ethereum smart contract

  const [buffer, setBuffer] = useState(null) //holds the path to the file which the user wants tu upload
  const [name, setName] = useState("") //holds the name of the to be uploaded file
  const [type, setType] = useState("") //holds the type of the to be uploaded file

  const [personalBIMmodels, setPersonalBIMmodels] = useState([]) //holds the onchain stored reference keys for personal bim models stored in IPFS
  const [user, setUser] = useState("") //holdes the wallet address of the user in the frontend
  const [selectedURN, setSelectedURN] = useState("") //holdes the CID of the personal BIM model which was selected by the user for perfoming the onchain computation or was selected for a download

  //on mount
  useEffect(()=>{
    const test = async () => {
        try {

          //get the user
          const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")
          const account = await web3.currentProvider.selectedAddress;
          setUser(account)

          //connect to smart contract managing the IPFS storage method
          //const smartCon = new web3.eth.Contract(ABI_IPFS, ADRESS_IPFS)
          //setOnchainSmartContract(smartCon)

          //get all bim models stored in IPFS/filecoin
          //https://web3.storage/
          //const models = await smartCon.methods.getIPFSModels().call()
          //setPersonalBIMmodels(models)
      






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
      setType(file.type)
      setName(file.name)
    }
  }

  //function uploads bim model to IPFS and stores the key on ethereum
  //https://www.youtube.com/watch?v=pTZVoqBUjvI&t=1320s
  const upload = async () => {
    try {
      // Adding file inside state variable 'buffer' to IPFS using the IPFS connection from above
      const decentralFile = await ipfs.add(buffer)

      //store the key (aka cid) to the files in IPFS on the ethereum blockchain
      onchainSmartContract.methods.uploadFile(
        decentralFile.path,
        decentralFile.size,
        type === '' ? 'none' : type, 
        name
      ).send({from:user}).on('transactionHash', (hash) => {
        window.location.reload()
      }).on('error', (e) =>{
        console.log(e)
        window.alert('Error')
      })
    } catch (error) {
      console.log(error)
    }
  }

  //function downloads bim model from IPFS and loads it into frontend
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
        In the upcoming one can test the possibility to store entire BIM models on Ethereum. 
      </p>
      <h4>Upload your BIM model to Ethereum</h4>
      <label htmlFor='input-file'>Select and upload bim model: </label>
      <input name='input-file' type="file" onChange={captureFile}/>
      <button type="button"onClick={upload}>Upload</button>
        
      <h4>Your BIM models on Ethereum</h4>
      {personalBIMmodels.length === 0 ?
        <p>You currently do not possess any BIM models on Ethereum in your account: '{user}' according to the Ethereum Blockchain!</p>
        :
        <table className="table-sm table-bordered text-monospace" style={{ width: '1000px', maxHeight: '450px'}}>
          <thead style={{ 'fontSize': '15px' }}>
            <tr className="bg-dark text-white">
              <th scope="col" style={{ width: '10px'}}>id</th>
              <th scope="col" style={{ width: '200px'}}>name</th>
              <th scope="col" style={{ width: '120px'}}>type</th>
              <th scope="col" style={{ width: '90px'}}>size</th>
              <th scope="col" style={{ width: '90px'}}>date</th>
              <th scope="col" style={{ width: '120px'}}>hash/view/get</th>
            </tr>
          </thead>
          { personalBIMmodels.map((file, key) => {
            return(
              <thead style={{ 'fontSize': '12px' }} key={key}>
                <tr>
                  <td>{file.fileId}</td>
                  <td>{file.fileName}</td>
                  <td>{file.fileType}</td>
                  <td>{file.fileSize}</td>
                  <td>{moment.unix(file.uploadTime).format('h:mm:ss A M/D/Y')}</td>
                  <td>
                    <a
                      href={"https://ipfs.infura.io/ipfs/" + file.fileHash}
                      rel="noopener noreferrer"
                      target="_blank">
                      {file.fileHash.substring(0,10)}...
                    </a>
                  </td>
                </tr>
              </thead>
            )
          })}
        </table>    
      }
    </div>
  );
}

export default Onchain100;