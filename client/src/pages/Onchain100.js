import React, {useEffect, useState} from 'react';
import Web3 from 'web3';
import axios from'axios';
import moment from 'moment';
import qs from 'qs';
import {ADRESS_ONCHAIN100, ABI_ONCHAIN100, ADRESS, ABI} from '../config'; //importing the ganache truffle address of deployed smart contract as well as the abi of the smart contract

//Connectin to IPFS via infura
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values


function Onchain100() {

    //state variables
    const [onchainSmartContract, setOnchainSmartContract] = useState(null) //holds the ethereum smart contract
    const [meta, setMeta] = useState("") //holds the inputed meta data of the to be uploaded bim model
    const [geom, setGeom] = useState("") //holds the inputed geometry data of the to be uploaded bim model
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

            //get the user
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
            

            //get Key of all bim models stored in the OSS of autodesk forge
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
            console.log("Keys in OSS Bucket", urns)
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

        //load in the Key of all user's personal bim models
        try{

        //get Key of all personal bim models stored on blockchain
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

    //deprecated: function which captures the inputed JSON bim model file before user uploads it to ethereum
    const captureFile = event => {
        event.preventDefault()
        const file = event.target.files[0]
        const reader = new window.FileReader() //functions like a library
        reader.readAsText(file) //read in file as text

        //once reading is done (aka "on load end") access the content of the file by reader.result
        reader.onloadend = () => {
            const model = JSON.parse(reader.result)
            setMeta(model.meta_data)
            setGeom(model.geom_data)
            setSize(file.size) //in bytes
        }
    }

    //function uploads bim model on ethereum
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
            if(metadata !== null & properties !== null){
                
                //upload metadata and geometry of the selected BIM model to ethereum
                const receipt = await onchainSmartContract.methods.setOnchainModels(JSON.stringify(metadata.data.data.metadata), JSON.stringify(properties.data.data.collection)).send({from : user, gasLimit : 30000000})

                if(receipt){

                    console.log(receipt)

                    var file_size = Buffer.byteLength(JSON.stringify(metadata)) + Buffer.byteLength(JSON.stringify(properties))
    
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
                        "gas" : gas,
                        "time" : "null" //in ms
                    }
                    
                    console.log("measurement result:", measurement_data)
    
                    //add measurement data to googlesheets
                    /*
                    await axios.post(
                        'https://sheet.best/api/sheets/ee03ddbd-4298-426f-9b3f-f6a202a1b667',
                        measurement_data
                    )*/
    
                    //alert("view console to check measurement data of upload to ethereum")
                    //window.location.reload()
                }
            }else{
                console.log("ERROR: The download from OSS bucket via model derivative API failed!")
            }
        } catch (error) {
            console.log(error)
        }
    }

    //old version: function uploads bim model on ethereum
    //https://www.youtube.com/watch?v=pTZVoqBUjvI&t=1320s
    const uploadDeprecated = async () => {
        try {
            const receipt = await onchainSmartContract.methods.setOnchainModels(meta, geom).send({from:user, gasLimit: 8000000000})

            if(receipt){

                //get file size 
                /* old computation of file size
                //get size of uploaded file in bytes
                const json_model = {
                    "meta" : meta,
                    "geom" : geom
                }
                var file_size  = Buffer.byteLength(JSON.stringify(json_model))
                */
                var file_size = Buffer.byteLength(JSON.stringify(meta)) + Buffer.byteLength(JSON.stringify(geom))

                //get transaction's used gas amount
                //web3-documentation: https://web3js.readthedocs.io/en/v1.2.11/web3-eth.html#gettransactionreceipt
                var gas = receipt.gasUsed
                
                //summary measurement data
                const measurement_data = {
                    "timestamp" : (new Date()).toString(),
                    "method" : "onchain100",
                    "operation"	: "upload",
                    "file_key" : user+"-"+personalBIMmodels.length,
                    "file_name" : "",
                    "file_size_ipfs" : 0, //in bytes
                    "file_size_oss" : 0, //in bytes
                    "file_size_ethereum" : file_size, //in bytes
                    "gas" : gas,
                    "time" : "null" //in ms
                }
                
                console.log("measurement result:", measurement_data)

                //add measurement data to googlesheets
                /*
                await axios.post(
                    'https://sheet.best/api/sheets/ee03ddbd-4298-426f-9b3f-f6a202a1b667',
                    measurement_data
                )*/

                alert("view console to check measurement data of upload to ethereum")
                window.location.reload()

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
            }
        } catch (error) {
            console.log(error)
        }
    }

    //function downloads bim model from ethereum and loads it into frontend
    //key = an integer which holds the position of the element in the BIMmodels array you desire to download
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
                    console.log("downloaded bim model from ethereum")
                    console.log("meta data:", model.meta.data)
                    console.log("geom data:", model.geom.data)

                    //compute performance time
                    var performance_time = end.getTime() - start.getTime()

                    //get size of the downloaded file in bytes
                    var file_size  = Buffer.byteLength(JSON.stringify(model))

                    //summary measurement data to googlesheets
                    const measurement_data = {
                        "timestamp" : end.toString(), 
                        "method" : "onchain100",
                        "operation"	: "download",
                        "file_key" : selectedKey,
                        "file_name" : "",
                        "file_size_ipfs" : 0, //in bytes
                        "file_size_oss" : 0, //in bytes
                        "file_size_ethereum" : file_size, //in bytes
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
                    console.log("ERROR: No data received from ethereum!")
                }
            } catch (error) {
                console.log(error)
            }
        }else{
            alert("PLease select key of personal im model on ethereum before downloading it!")
        }
    }

    const compute = async () => {

    }

    return (
    <div>
        <p>Dear user: {user},</p>
        <p>In the upcoming, you can test the possibility to store entire BIM models on Ethereum.</p>
        <h4>Upload your BIM model to Ethereum</h4>

        {/*<label htmlFor='input-file'>insert bim model JSON file: </label>
        <input name='input-file' type='file' onChange={captureFile}/>*/}
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
            <button type="button" onClick={compute}>Compute on chain</button>
            <button type="button" onClick={download}>Download</button>
        </div>
        }
    </div>
    );
}

export default Onchain100;