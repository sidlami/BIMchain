pragma solidity ^0.6.0;

//SPDX-License-Identifier: UNLICENSED
contract On_offchain {
    
    //state variable in memory on the blockchain for address of contract's owner
    address public owner = msg.sender;
    
    //mapping variable stores all personal offchain bim models by the users wallet address
    //the bim models are all hashed and stored in the uint256 array
    mapping(address => uint256[]) private personal_offchain_models;
    
    //get hash key of all personal offchain bim models based on user's address
    function getOffchainModels(address user) public view returns(uint256[] memory){
        return personal_offchain_models[user]; //returns zero if user has no personal offchain bim model
    }
    
    //add the hash key of a new personal offchain bim model to all of the user's offchin bim models
    function setOffchainModels(uint256 new_offchain_model) public{
        personal_offchain_models[msg.sender].push(new_offchain_model);
    }
}