
import './App.css';
import React, {useEffect, useState} from 'react';
import OnchainIPFS from './pages/OnchainIPFS';
import Onchain100 from './pages/Onchain100';
import On_offchain from './pages/On_offchain';

function App() {

  const [testingMode, setTestingMode] = useState(false)

  return (
    <div style={{position: "absolute", left: "50px", backgroundColor : testingMode ? "#fc03d7" : "#FFFFFF"}}>
      <h1>Welcome to BIMchain</h1>
      <label htmlFor='slider'>Activate testing mode:</label>
      <input name="slider" type="checkbox" onClick={() => setTestingMode(!testingMode)}></input>
      <p>
        This DApp functions as a prototype for testing the possibilities to store BIM models on the ethereum blockchain.
      </p>
      <p>These are the current storage methods: </p>
      {/*<label htmlFor="select-method">Select a storage method: </label>
      <select name="select-model" value={selectedMethod} onChange={(e)=>setSelectedMethod(e.target.value)}>
        <option value={0} disabled hidden>Choose here</option>
        <option value={1}>on and offchain storage</option>
        <option value={2}>onchain storage (IPFS/Filecoin)</option>
      </select>*/}
      <div style={{position: "absolute", left: "25px", backgroundColor : testingMode ? "#fc03d7" : "#FFFFFF"}}>
        <h3>1. ON- AND OFFCHAIN STORAGE</h3>
        <On_offchain testing={testingMode}></On_offchain>
        <br></br>
        <br></br>
        
        <h3>2. ONCHAIN STORAGE (IPFS)</h3>
        <OnchainIPFS testing={testingMode}></OnchainIPFS>
        <br></br>
        <br></br>

        <h3>3. ONCHAIN STORAGE (100% ON ETHEREUM)</h3>
        <Onchain100 testing={testingMode}></Onchain100>
      </div>
    </div>
  );
}

export default App;
