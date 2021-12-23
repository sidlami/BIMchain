pragma solidity ^0.8.0;

//SPDX-License-Identifier: UNLICENSED
contract Onchain100 {
    
    //state variable in memory on the blockchain for address of contract's owner
    address public owner = msg.sender;

    struct MetaData{
        string data;
    }

    struct GeomData{
        string data;
    }

    struct BIMmodel {
        MetaData meta;
        GeomData geom;
        uint uploadTime;
    }
    
    //mapping variable stores all personal offchain bim models by the users wallet address
    mapping(address => BIMmodel[]) private personal_onchain_models;
    
    //get URN of all personal offchain bim models based on user's address
    function getOnchainModels() public view returns(BIMmodel[] memory){
        return personal_onchain_models[msg.sender]; //returns zero if user has no personal offchain bim model
    }
    
    //add URN of a new personal offchain bim model to all of the user's offchain bim models
    function setOnchainModels(string memory _meta, string memory _geom) public{
        // Make sure the file hash exists
        require(bytes(_meta).length > 0);
        // Make sure file type exists
        require(bytes(_geom).length > 0);

        personal_onchain_models[msg.sender].push(
            BIMmodel(
                MetaData(_meta),
                GeomData(_geom),
                block.timestamp
            )
        );
    }
}