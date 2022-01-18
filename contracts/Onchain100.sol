pragma solidity ^0.8.0;

//SPDX-License-Identifier: UNLICENSED
contract Onchain100 {
    
    //state variable in memory on the blockchain for address of contract's owner
    address public owner = msg.sender;

    struct BIMmodel {
        string meta;
        string geom;
    }
    
    //mapping variable stores all personal offchain bim models by the users wallet address
    mapping(address => BIMmodel[]) private personal_onchain_models;
    
    //get number of personal onchain bim models
    function getOnchainModelKeys() public view returns(uint){
        return personal_onchain_models[msg.sender].length; //returns zero if user has no personal offchain bim model
    }

    //get specific onchaim bim model based on its key
    function getOnchainModels(uint _key) public view returns(BIMmodel memory){
        return personal_onchain_models[msg.sender][_key]; //returns zero if user has no personal offchain bim model
    }
    
    //add URN of a new personal offchain bim model to all of the user's offchain bim models
    function setOnchainModels(string memory _meta, string memory _geom) public{
        // Make sure the meta data exists
        require(bytes(_meta).length > 0);
        // Make sure geometry data exists
        require(bytes(_geom).length > 0);

        personal_onchain_models[msg.sender].push(
            BIMmodel(
                _meta,
                _geom
            )
        );
    }
}