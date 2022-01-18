pragma solidity ^0.8.0;

//SPDX-License-Identifier: UNLICENSED
contract On_offchain {
    
    //state variable in memory on the blockchain for address of contract's owner
    address public owner = msg.sender;
    
    //mapping variable stores all personal offchain bim models by the users wallet address
    //the uint256 array stores contains all of the user's URNs of the bim model stored in the OSS of autodesk forge,
    //where the bim models are actually stored 
    mapping(address => string[]) private personal_offchain_models;
    
    //get URN of all personal offchain bim models based on user's address
    function getOffchainModels() public view returns(string[] memory){
        return personal_offchain_models[msg.sender]; //returns zero if user has no personal offchain bim model
    }
    
    //add URN of a new personal offchain bim model to all of the user's offchain bim models
    function setOffchainModels(string memory urn_new_offchain_model) public{
        personal_offchain_models[msg.sender].push(urn_new_offchain_model);
    }
}