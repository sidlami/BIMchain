import React, {useEffect, useState} from 'react';
import Web3 from 'web3';
import axios from'axios';
import moment from 'moment';
import qs from 'qs';
import {ADRESS_ONCHAIN100, ABI_ONCHAIN100 } from '../config'; //importing the ganache truffle address of deployed smart contract as well as the abi of the smart contract

//Connectin to IPFS via infura
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values


function Onchain100() {

    //state variables
    const [onchainSmartContract, setOnchainSmartContract] = useState(null) //holds the ethereum smart contract
    const [meta, setMeta] = useState("") //holds the inputed meta data of the to be uploaded bim model
    const [geom, setGeom] = useState("") //holds the inputed geometry data of the to be uploaded bim model
    const [personalBIMmodels, setPersonalBIMmodels] = useState([]) //holds an array of all personal bim models stored on ethereum
    const [user, setUser] = useState("") //holdes the wallet address of the user in the frontend
    const [selectedURN, setSelectedURN] = useState("") //holdes the key of the personal BIM model which was selected by the user for perfoming the onchain computation or was selected for a download

    //on mount
    useEffect(()=>{
    const test = async () => {
        try {

            //get the user
            const web3 = new Web3(Web3.givenProvider || "http://localhost:8545")
            const account = await web3.currentProvider.selectedAddress;
            setUser(account)

            //connect to smart contract managing 100% on-chain 
            const smartCon = new web3.eth.Contract(ABI_ONCHAIN100, ADRESS_ONCHAIN100)
            setOnchainSmartContract(smartCon)

            //get all bim models stored on ethereum
            const models = await smartCon.methods.getOnchainModels().call()
            setPersonalBIMmodels(models)
            console.log("models on ethereum: ", models)
            console.log("models geom data: ", models[0].geom.data)



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

    //function uploads bim model to IPFS and stores the key on ethereum
    //https://www.youtube.com/watch?v=pTZVoqBUjvI&t=1320s
    const upload = async () => {
        try {
            onchainSmartContract.methods.setOnchainModels(
                meta,
                geom
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

    //function downloads bim model from ethereum and loads it into frontend
    const download = async () => {
    console.log(selectedURN)
    }

    const compute = async () => {

    }

    return (
    <div>
        <p>In the upcoming one can test the possibility to store entire BIM models on Ethereum.</p>
        <h4>Upload your BIM model to Ethereum</h4>

        <label htmlFor='input-meta'>insert meta data: </label>
        <input name='input-meta' type='text' onChange={(e) => setMeta(e.target.value)}/>

        <label htmlFor='input-geom'>insert geometry data: </label>
        <input name='input-geom' type='text' onChange={(e) => setGeom(e.target.value)}/>

        <button type='button' onClick={upload}>Upload</button>
        
        <h4>Your BIM models on Ethereum</h4>
        {personalBIMmodels.length === 0 ?
        <p>You currently do not possess any BIM models on Ethereum in the name of your account: '{user}'</p>
        :
        <div>
            <label htmlFor="select-model">Select your personal BIM model on Ethereum: </label>
            <select name="select-model" value={selectedURN} onChange={(e)=>setSelectedURN(e.target.value)}>
                <option value="" disabled hidden>Choose here</option>
                {
                personalBIMmodels.map(item =>{
                    return(
                    <option key ={item} value={item}>
                        {JSON.stringify(item)}
                    </option>
                    )
                }) 
                }
            </select>
            <button type="button" onClick={compute}>Compute on chain</button>
            <button type="button">Download</button>
        </div>
        }
    </div>
    );
}

export default Onchain100;