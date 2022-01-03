const express = require('express');
const cors = require('cors');
const router = express.Router();
const app = express();
const fs = require('fs');
const path = require('path');

//set up 
app.use(cors()); //so that frontend can use axios to call api endpoints
app.use(express.json()); //so that one can send a body via post requests

//api endpoints:
/*
//1. get name of all files from test_models_in_json folder
router.get("/api/file_names", async (req, res) => {
    const file_names = fs.readdirSync(path.join(__dirname, "test_models_in_json"))
    if(file_names){
        console.log(file_names)
    }else{
        console.log("There is no json test bim model in the folder!")
    }
});

//2. get one file based on name of file
router.get("/api/file", async (req, res) => {

})*/

//3. post file to test_models_in_json folder
router.post("/api/file", async (req, res) => {
    try {
        console.log("file name:", req.body.file_name)
        console.log("new json bim model:", req.body.newJsonBimModel)
        var json_file_name = req.body.file_name +".json"
        fs.writeFileSync(path.join(__dirname, "test_models_in_json", json_file_name), JSON.stringify(req.body.newJsonBimModel))
        res.send("successful upload to node js folder!")
    } catch (error) {
        console.log(error);
    }
});

// add router in the Express app.
app.use("/", router);

app.listen(3001, () => console.log("server running on port 3001"));