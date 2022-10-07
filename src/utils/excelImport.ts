// const xlsx = require('xlsx');
// const fs = require('fs');

// const workbook = xlsx.readFile(__dirname + '/source.xlsx');
// const json = {};
// let i = workbook.SheetNames.length;

// while (i--) {
//   const sheetname = workbook.SheetNames[i];
//   json[sheetname] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetname]);
// }

// fs.writeFile('시트1.json', JSON.stringify(json['시트1']));
export {};
