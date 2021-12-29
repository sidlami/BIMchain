/*const SPREADSHEET_ID = '1Xp3o1-qPuFA504lvX95iYxN2GQ-uRfkDxQ7fJYeFFjw'; //from the URL of your blank Google Sheet
const CLIENT_ID = '803660473047-tgrk61i690mg179a9eu1ersrqodguvr6.apps.googleusercontent.com'; //from https://console.developers.google.com/apis/credentials
const API_KEY = 'AIzaSyDP8IPVLGvKyMJ9PUPulX8gvsUY1syMUns'; //https://console.developers.google.com/apis/credentials
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

export const initClient = () =>{
    gapi.load('client:auth2');
    gapi.client.init({
        'apiKey': API_KEY,
        'clientId': CLIENT_ID,
        'scope': SCOPE,
        'discoveryDocs': ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
    }).then(()=> {
        console.log(gapi.auth2.getAuthInstance().isSignedIn.listen()); //add a function called `updateSignInStatus` if you want to do something once a user is logged in with Google
    });
}

//note: 
//method = onchain100, onchain_ipfs or on_off
//operation = upload, computation or download
export const appendRow = (method, operation, file_key, file_size, gas, performance_time) =>{
    const params = {
        // The ID of the spreadsheet to update.
        spreadsheetId: SPREADSHEET_ID, 
        // The A1 notation of a range to search for a logical table of data.Values will be appended after the last row of the table.
        range: 'raw_data', //this is the default spreadsheet name, so unless you've changed it, or are submitting to multiple sheets, you can leave this
        // How the input data should be interpreted.
        valueInputOption: 'RAW', //RAW = if no conversion or formatting of submitted data is needed. Otherwise USER_ENTERED
        // How the input data should be inserted.
        insertDataOption: 'INSERT_ROWS', //Choose OVERWRITE OR INSERT_ROWS
      };
    
      const valueRangeBody = {
        'majorDimension': 'ROWS', //log each entry as a new row (vs column)
        'values': [method, operation, file_key, file_size, gas, performance_time] //convert the object's values to an array
      };
    
      let request = gapi.client.sheets.spreadsheets.values.append(params, valueRangeBody);
      request.then(function (response) {
        // TODO: Insert desired response behaviour on submission
        console.log(response.result);
      }, function (reason) {
        console.error('error: ' + reason.result.error.message);
      });
}
*/