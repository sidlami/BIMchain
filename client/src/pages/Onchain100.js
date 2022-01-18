import React, {useEffect, useState} from 'react';
import Web3 from 'web3';
import axios from'axios';
import moment from 'moment';
import qs from 'qs';
import {ADRESS_ONCHAIN100, ABI_ONCHAIN100, ADRESS, ABI} from '../config'; //importing the ganache truffle address of deployed smart contract as well as the abi of the smart contract

//Connectin to IPFS via infura
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values


function Onchain100(props) {

    //state variables
    const [onchainSmartContract, setOnchainSmartContract] = useState(null) //holds the ethereum smart contract
    const [size, setSize] = useState(null)
    const [personalBIMmodels, setPersonalBIMmodels] = useState([]) //holds an array of all personal bim models stored on ethereum
    const [uploadableBIMmodels, setUploadableBIMmodels] = useState([]) //holds an array of all BIM models in OSS which can be uploaded to ethereum
    const [user, setUser] = useState("") //holds the wallet address of the user in the frontend
    const [selectedKey, setSelectedKey] = useState("") //holds the key of the personal BIM model which was selected by the user for perfoming the onchain computation or was selected for a download
    const [toBeUploadedModel, setToBeUploadedModel] = useState("") //holds the selected OSS key of the BIM model the user wants to upload to ethereum 

    //on mount
    useEffect(()=>{
        const test = async () => {
            try {

                //conenct to web3
                const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")

                //get user's adress
                const accounts = await web3.eth.getAccounts()
                setUser(accounts[0])

                //connect to smart contract managing 100% on-chain 
                const smartCon = new web3.eth.Contract(ABI_ONCHAIN100, ADRESS_ONCHAIN100)
                setOnchainSmartContract(smartCon)

                //get number of personal bim models stored on ethereum
                const numberModels = await smartCon.methods.getOnchainModelKeys().call()
                console.log("number of personal models on ethereum", numberModels)
                
                const models = []
                for(var i=0; i<numberModels; i++){
                    models.push(i)
                }
                setPersonalBIMmodels(models)

                //get models in OSS which can be uploaded
                const smartConOffchain = new web3.eth.Contract(ABI, ADRESS)
                const personalOffchainModels = await smartConOffchain.methods.getOffchainModels().call()
                setUploadableBIMmodels(personalOffchainModels)
            } catch (error) {
                console.log(error)
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

    //function uploads bim model to ethereum
    const upload = async () => {
        try {
            //authenticate to forge app
            const token = await authenticateToForge()

            //get metadata based on the selected key of the to be uploaded model
            const metadata = await axios.get(
                `https://developer.api.autodesk.com/modelderivative/v2/designdata/${toBeUploadedModel}/metadata`, 
                {
                headers : {
                    Authorization: `Bearer ${token}`
                }
                }
            )
            
            //extract model guid from meta data
            const guid = metadata.data.data.metadata[0].guid
            
            //get properties based on selected key and guid
            const properties = await axios.get(
                `https://developer.api.autodesk.com/modelderivative/v2/designdata/${toBeUploadedModel}/metadata/${guid}/properties`, 
                {
                headers : {
                    Authorization: `Bearer ${token}`
                }
                }
            )

            //print out model
            console.log("metadata:", metadata)
            console.log("guid:", metadata.data.data.metadata[0].guid)
            console.log("properties:", properties)
            
            //check if model is how it should be
            if(metadata !== null & properties !== null & properties.data.data.collection !== null){

                //compute file size of the to be uploaded bim model
                var file_size = Buffer.byteLength(JSON.stringify(metadata.data.data.metadata)) + Buffer.byteLength(JSON.stringify(properties.data.data.collection))
                console.log("size of to be uploaded bim model in bytes:", file_size)

                //estimate gas
                const estimatedGas = await onchainSmartContract.methods.setOnchainModels(JSON.stringify(metadata.data.data.metadata), JSON.stringify(properties.data.data.collection)).estimateGas()
                console.log("estimate gas cost of uploading whole BIM model:", estimatedGas)

                //upload metadata and geometry of the selected BIM model to ethereum
                const receipt = await onchainSmartContract.methods.setOnchainModels(JSON.stringify(metadata.data.data.metadata), JSON.stringify(properties.data.data.collection)).send({from : user})

                if(receipt){

                    console.log(receipt)

                    //get transaction's used gas amount
                    //web3-documentation: https://web3js.readthedocs.io/en/v1.2.11/web3-eth.html#gettransactionreceipt
                    var gas = receipt.gasUsed
                    
                    //summary measurement data
                    const measurement_data = {
                        "timestamp" : (new Date()).toString(),
                        "method" : "onchain100",
                        "operation"	: "upload",
                        "file_key" : toBeUploadedModel,
                        "file_name" : metadata.data.data.metadata[0].name,
                        "file_size_ipfs" : 0, //in bytes
                        "file_size_oss" : 0, //in bytes
                        "file_size_ethereum" : file_size, //in bytes
                        "gas_write"	: gas,
                        "gas_read" : 0,
                        "time" : 0,
                        "extra_time" : 0
                    }
                    
                    console.log("measurement result:", measurement_data)
    
                    //add measurement data to googlesheets
                    if(props.testing){
                        await axios.post(
                            'https://sheet.best/api/sheets/ee03ddbd-4298-426f-9b3f-f6a202a1b667',
                            measurement_data  
                        )
                        window.location.reload()
                    }else{
                        alert("file: "+toBeUploadedModel+" uploaded to Ethereum. View console to check measurement data of upload to Ethereum. Please reload the page to select this newly uploaded file for download.")

                    }
                }
            }else{
                console.log("ERROR: The download from OSS bucket via model derivative API failed! Try again :)")
            }
        } catch (error) {
            console.log(error)
        }
    }


    //function downloads bim model from ethereum and loads it into frontend
    const download = async () => {
        if(selectedKey){
            try {
                var end, start;
                start = new Date();
                const model = await onchainSmartContract.methods.getOnchainModels(selectedKey).call()
                end = new Date();

                //check if model is how it should be
                if(model){
                    //print out model
                    console.log("downloaded bim model from ethereum:")
                    console.log("meta data:", model.meta)
                    console.log("geom data:", model.geom)

                    //extract file name
                    const metadata = JSON.parse(model.meta)
                    const file_name = metadata[0].name

                    //compute performance time
                    const performance_time = end.getTime() - start.getTime()

                    //get size of the downloaded file in bytes
                    const file_size  = Buffer.byteLength(JSON.stringify(model))

                    //estimate gas cost of calling whole BIM model stored on ethereum
                    const estimatedGas = await onchainSmartContract.methods.getOnchainModels(selectedKey).estimateGas()

                    //summary measurement data to googlesheets
                    const measurement_data = {
                        "timestamp" : end.toString(), 
                        "method" : "onchain100",
                        "operation"	: "download",
                        "file_key" : selectedKey,
                        "file_name" : file_name,
                        "file_size_ipfs" : 0, //in bytes
                        "file_size_oss" : 0, //in bytes
                        "file_size_ethereum" : file_size, //in bytes
                        "gas_write"	: 0,
                        "gas_read" : estimatedGas, //extra gas could be added due to read in on mount function
                        "time" : performance_time,
                        "extra_time" : 0 //extra time could be added due to read in on mount function
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
                    console.log("ERROR: No data received from ethereum!")
                }
            } catch (error) {
                console.log(error)
            }
        }else{
            alert("Please select key of personal im model on ethereum before downloading it!")
        }
    }

    return (
    <div>
        <p>Dear user: {user},</p>
        <p>In the upcoming, you can test the possibility to store entire BIM models on Ethereum.</p>
        <h4>Upload your BIM model to Ethereum</h4>

        {uploadableBIMmodels?
            <div>
                <label htmlFor="select-uploadable-model">Select your BIM model you want to upload: </label>
                <select name="select-uploadable-model" value={toBeUploadedModel} onChange={(e)=>setToBeUploadedModel(e.target.value)}>
                    <option value="" disabled hidden>Choose here</option>
                    {
                    uploadableBIMmodels.map((item, idx) =>{
                        return(
                        <option key ={idx} value={item}>
                            {item}
                        </option>
                        )
                    }) 
                    }
                </select>
            </div>
        :
        ""
        }
        <button type='button' onClick={upload}>Upload</button>
        
        <h4>Your BIM models on Ethereum</h4>
        {personalBIMmodels.length === 0 ?
            <p>You currently do not possess any BIM models on Ethereum in the name of your account: '{user}'</p>
        :
        <div>
            <label htmlFor="select-model">Select your personal BIM model on Ethereum: </label>
            <select name="select-model" value={selectedKey} onChange={(e)=>setSelectedKey(e.target.value)}>
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
            <button type="button" onClick={download}>Download</button>
        </div>
        }
    </div>
    );
}

export default Onchain100;