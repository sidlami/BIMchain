pragma solidity ^0.8.0;

//SPDX-License-Identifier: UNLICENSED
contract OnchainIPFS {
    
    //state variable in memory on the blockchain for address of contract's owner
    address public owner = msg.sender;
    
    //mapping variable stores all personal IPFS bim models as a 'File' by the users wallet address
    mapping(address => string[]) private personal_IPFS_models;
    
    //get all personal IPFS bim models of type 'File' based on user's address
    function getIPFSModels() public view returns(string[] memory){
        // Make sure uploader address exists
        require(msg.sender!=address(0));
        return personal_IPFS_models[msg.sender]; //returns zero if user has no personal IPFS bim model
    }

    //get specific IPFS bim model based on key

    //add a new personal IPFS bim model as type 'File' to all of the user's IPFS bim models
    function uploadFile(string memory _fileHash) public{
        // Make sure the file hash exists
        require(bytes(_fileHash).length > 0);

        // Add File to the contract
        personal_IPFS_models[msg.sender].push(_fileHash);
    }
}