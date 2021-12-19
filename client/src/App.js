
import './App.css';
import React, {useEffect, useState} from 'react';
import Onchain from './pages/Onchain';
import On_offchain from './pages/On_offchain';


function App() {

  const [selectedMethod, setSelectedMethod] = useState(0)

  return (
    <div>
      <h1>Welcome to BIMchain</h1>
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
      <br></br>
      <br></br>
      <h3>1. ON- AND OFFCHAIN STORAGE</h3>
      <On_offchain></On_offchain>
      <br></br>
      <br></br>
      
      <h3>2. ONCHAIN STORAGE (IPFS/FILECOIN)</h3>
      <Onchain ></Onchain>
    </div>
  );
}

export default App;
