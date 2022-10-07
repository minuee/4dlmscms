import React, { useState, useCallback } from 'react';
// import XLSX from 'xlsx';
import { showNotification, classNames } from '@/utils/commonFn';

export const useExcel = () => {
  const [excelData, setExcelData] = useState<Array<any>>([]);
  const [fileName, setFileName] = useState<string>('No file selected.');

  // const excelImport = (e) => {
  //   const input = e.target;
  //   if (!input.files[0]) return;
  //   const reader = new FileReader();
  //   reader.onload = function () {
  //     const fileData = reader.result;
  //     let wb = XLSX.read(fileData, { type: 'binary' });
  //     wb.SheetNames.forEach(function (sheetName) {
  //       const rowObj = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
  //       console.log(JSON.stringify(rowObj));
  //       setFileName(input.files[0].name);
  //       setExcelData(rowObj);
  //       // return rowObj;
  //     });
  //   };
  //   reader.readAsBinaryString(input.files[0]);
  // };

  // const excelExport = () => {
  //   // TODO: 파일이름 커스텀할 수 있게 해주기
  //   const myFile = 'myFile.xlsx';
  //   if (!excelData) {
  //     showNotification('noDataToExport', 'error');
  //     return;
  //   }

  //   const myWorkSheet = XLSX.utils.json_to_sheet(excelData);
  //   const myWorkBook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(myWorkBook, myWorkSheet, 'myWorkSheet');
  //   XLSX.writeFile(myWorkBook, myFile);
  // };
  const changeExcelData = (indexRow, index, e) => {
    // formik.handleBlur(e);
    const key = Object.keys(excelData[0])[index].toString();
    // const key = keys[index];
    setExcelData((prev) =>
      prev.map((el, i) =>
        i === indexRow ? { ...el, [key]: e.target.value } : el
      )
    );
  };

  const getExtensionOfFilename = (filename: string): string => {
    const fileLen = filename.length;

    /**
     * lastIndexOf('.')
     * 뒤에서부터 '.'의 위치를 찾기위한 함수
     * 검색 문자의 위치를 반환한다.
     * 파일 이름에 '.'이 포함되는 경우가 있기 때문에 lastIndexOf() 사용
     */
    const lastDot = filename.lastIndexOf('.');

    // 확장자 명만 추출한 후 소문자로 변경
    const fileExt = filename.substring(lastDot, fileLen).toLowerCase();

    return fileExt;
  };

  return {
    excelData,
    fileName,
    // excelImport,
    // excelExport,
    changeExcelData,
    getExtensionOfFilename,
  };
};
