pragma solidity ^0.8.0;

//SPDX-License-Identifier: UNLICENSED
contract Onchain {
    
    //state variable in memory on the blockchain for address of contract's owner
    address public owner = msg.sender;

    struct File {
        uint fileId;
        string fileHash;
        uint fileSize;
        string fileType;
        string fileName;
        string fileDescription;
        uint uploadTime;
    }
    
    //mapping variable stores all personal IPFS bim models as a 'File' by the users wallet address
    mapping(address => File[]) private personal_IPFS_models;

    //mapping address to amount of personal IPFS bim models
    mapping(address => uint) private personal_model_count;
    
    //get all personal IPFS bim models of type 'File' based on user's address
    function getIPFSModels() public view returns(File[] memory){
        // Make sure uploader address exists
        require(msg.sender!=address(0));
        return personal_IPFS_models[msg.sender]; //returns zero if user has no personal IPFS bim model
    }
    
    //add a new personal IPFS bim model as type 'File' to all of the user's IPFS bim models
    function setIPFSModels(File memory new_IPFS_model) public{
        // Make sure uploader address exists
        require(msg.sender!=address(0));
        return personal_IPFS_models[msg.sender].push(new_IPFS_model);
    }

    //get count of personal IPFS bim models
    function getPersonalModelCount() public view returns(uint){
        // Make sure uploader address exists
        require(msg.sender!=address(0));
        return personal_model_count[msg.sender];
    }

    //set count of personal IPFS bim models
    function setPersonalModelCount() private{
        personal_model_count[msg.sender]++;
    }

    //event for file upload
    event FileUploaded(
        uint fileId,
        string fileHash,
        uint fileSize,
        string fileType,
        string fileName, 
        string fileDescription,
        uint uploadTime
    );

    function uploadFile(string memory _fileHash, uint _fileSize, string memory _fileType, string memory _fileName, string memory _fileDescription) public {
        // Make sure the file hash exists
        require(bytes(_fileHash).length > 0);
        // Make sure file type exists
        require(bytes(_fileType).length > 0);
        // Make sure file description exists
        require(bytes(_fileDescription).length > 0);
        // Make sure file fileName exists
        require(bytes(_fileName).length > 0);
        // Make sure uploader address exists
        require(msg.sender!=address(0));
        // Make sure file size is more than 0
        require(_fileSize>0);

        // Increment file id
        setPersonalModelCount();

        // Add File to the contract
        personal_IPFS_models[msg.sender].push(File(personal_model_count[msg.sender], _fileHash, _fileSize, _fileType, _fileName, _fileDescription, block.timestamp));

        // Trigger an event
        emit FileUploaded(personal_model_count[msg.sender], _fileHash, _fileSize, _fileType, _fileName, _fileDescription, block.timestamp);
    }
}