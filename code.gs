// deployment settings: execute as me and allow anyone

function doGet(e) {
  // 1. Define Spreadsheet ID
  // https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
  const SPREADSHEET_ID = 'SPREADSHEET_ID';
  
  try {
    // 2. Open the document by ID
    const doc = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 3. Get the sheet by its name
    const sheet = doc.getSheetByName('NAME_OF_SHEET'); 
    
    // 4. Get all the data in the sheet (Returns a 2D array)
    const data = sheet.getDataRange().getValues();
    
    // 5. Separate headers from the rows
    const headers = data[0];
    const rows = data.slice(1);
    
    // 6. Convert the 2D array into an array of objects (JSON format)
    const jsonData = rows.map(row => {
      let obj = {};
      headers.forEach((header, index) => {
        // This maps headers (ID, Start, Stop, etc.) to their row values
        obj[header] = row[index] !== "" ? row[index] : null; // converts empty cells to null
      });
      return obj;
    });

    // const jsonString = JSON.stringify(jsonData); // Create the JSON string
    // console.log(jsonString);
    
    // 7. Return the data as a JSON response
    return ContentService.createTextOutput(JSON.stringify(jsonData))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return an error message in JSON format if something fails
    return ContentService.createTextOutput(JSON.stringify({ "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}