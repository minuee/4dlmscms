import React, { useCallback, useState, useEffect } from 'react';
import { useFormik } from 'formik';
// import { useHistory } from 'react-router-dom';
// import { useTranslation } from 'react-i18next';
// import { ToastContainer } from 'react-toastify';
// import {
//   showNotification,
//   validationSchema,
//   classNames,
// } from '@/utils/commonFn';

// import { useAppSelector } from '@/redux/hooks';
// import { ReducerType } from '@/redux/reducer';
// import { User } from '@/redux/Auth/authSlices';

// import { PageLoaderModal } from 'comp/PageLoader/PageLoaderModal';

// import { user_password_change } from '@/graphQL/mypage';
// import { useCustomAxios } from '@/hooks/axios-hooks';

// import { MYPAGE } from 'sets/constants';

import Button from 'comp/Button/Button';
import TwoPointsSlider from 'comp/Input/TwoPointsSlider';
import DragDrop from 'comp/Input/DragDrop';
//test
// import Toggle from 'comp/Input/ToggleSlider';
// import Checkbox from 'comp/Input/Checkbox';
// import { Radio, RadioBlockTypeWrapper } from 'comp/Input/Radio';
import {
  TableTotal,
  TheadWrapper,
  TbodyWrapper,
  Table,
  TH,
  TR,
  TD,
} from 'comp/Table/Table';

// import XLSX from 'xlsx';

interface IF {}

const Test: React.FC<IF> = (props: IF) => {
  const [excelData, setExcelData] = useState<Array<any>>([]);
  const [fileName, setFileName] = useState<string>('No file selected.');
  const [initialValues, setInitialValues] = useState({});

  // TODO: Custom Hook으로 만들기
  // const excelImport = (e) => {
  //   const input = e.target;
  //   if (!input.files[0]) return;
  //   const reader = new FileReader();
  //   reader.onload = function () {
  //     const fileData = reader.result;
  //     let wb = XLSX.read(fileData, { type: 'binary' });
  //     wb.SheetNames.forEach(function (sheetName) {
  //       const rowObj = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
  //       // console.log(JSON.stringify(rowObj));
  //       setFileName(input.files[0].name);
  //       setExcelData(rowObj);
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

  useEffect(() => {
    // console.log('initialValues.length: ', Object.keys(initialValues).length);

    //test
    // if (Object.keys(initialValues).length > 0) return;
    // if (keys.length > 0) return;

    if (excelData) {
      const newInitialValues = new Object();
      excelData.map((t, indexRow) =>
        Object.values(t).map((e, index) => {
          const key = (indexRow + e.toString() + index).toString();
          newInitialValues[key] = e.toString();
        })
      );
      setInitialValues(newInitialValues);
      //test
      // setKeys(Object.keys(excelData[0]));
      if (newInitialValues)
        formik.setValues({ ...formik.values, ...newInitialValues });
    }
  }, [excelData]);
  //test
  // useEffect(() => {
  //   if (keys.length > 0) return;
  //   if (Object.keys(excelData[0])) setKeys(Object.keys(excelData[0]));
  // }, [excelData]);

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

  // ***** Formik logics
  const formik = useFormik({
    initialValues,
    // test
    // initialValues: {
    //   oldPassword: '',
    //   newPassword: '',
    //   newPasswordCheck: '',
    //   //test
    //   slider: 30,
    //   slider1: 10,
    // twoMin: 10,
    // twoMax: 100,
    //   // radioTest: '',
    //   // toggle: false,
    // },
    // validate: validateForm,
    onSubmit: async (values) => {
      // console.log('submit: ', values);
    },

    validateOnChange: false,
    validateOnBlur: false,
  });

  return (
    <>
      {/* test starts */}
      {/* <RadioBlockTypeWrapper>
                <Radio
                  radiotype='blockChild'
                  value='test'
                  name='radioTest'
                  label='radio'
                  id='radioTest1'
                />
                <Radio
                  radiotype='blockChild'
                  value='test2'
                  name='radioTest'
                  label='radio2'
                  id='radioTest2'
                />
                <Radio
                  radiotype='blockChild'
                  value='test3'
                  name='radioTest'
                  label='radio3'
                  id='radioTest3'
                />
              </RadioBlockTypeWrapper> */}
      {/* <Checkbox
                id='checkbox'
                name='chechkbox'
                value='checkBoxTest'
                label='checkbox test'
                checked
              /> */}
      {/* <Toggle noText name='toggle' onChange={formik.handleChange} /> */}

      {/* drag and drop test starts */}
      <DragDrop />
      {/* drag and drop test ends */}

      {/* excel import test */}
      <label htmlFor='fileTest' className='btn btn-primary'>
        Import Excel
      </label>
      <span id='selected-filename'>{fileName}</span>

      {/* <input
        className='sr-only'
        type='file'
        name='file'
        id='fileTest'
        onChange={(e) => excelImport(e)}
      />
      <Button color='btn-primary' onClick={excelExport}>
        Export
      </Button> */}

      {/* <TableTotal> */}
      <Table>
        <TheadWrapper first color='thead-dark'>
          <TR>
            {/* Object.keys(initialValues).length > 0 && */}
            {excelData &&
              Object.keys(initialValues).length > 0 &&
              Object.keys(excelData[0]).map((t, index) => (
                <TH key={(index + t).toString()}>{t}</TH>
              ))}
          </TR>
        </TheadWrapper>
        <TbodyWrapper>
          {excelData &&
            Object.keys(initialValues).length > 0 &&
            excelData.map((t, indexRow) => (
              <TR key={indexRow}>
                {Object.values(t).map((e, index) => (
                  <TD
                    key={(index + e.toString()).toString()}
                    value={
                      <input
                        className='bg-transparent'
                        type='text'
                        name={(indexRow + e.toString() + index).toString()}
                        // value={e.toString()} // 이렇게 하면 onChage가 안 먹음
                        onChange={formik.handleChange}
                        value={
                          formik.values[
                            (indexRow + e.toString() + index).toString()
                          ] || ''
                        }
                        onBlur={(event) =>
                          changeExcelData(indexRow, index, event)
                        }
                      />
                    }
                  />
                ))}
              </TR>
            ))}
        </TbodyWrapper>
      </Table>
      {/* </TableTotal> */}

      <TableTotal>
        <Table>
          <TheadWrapper first color='thead-dark'>
            <TR>
              <TH>test1</TH>
              <TH>test2</TH>
              <TH>test3</TH>
              <TH>test4</TH>
            </TR>
          </TheadWrapper>
          <TbodyWrapper>
            <TR>
              <TD value={<div>body</div>} />
              <TD value={<div>body</div>} />
              <TD value={<div>body</div>} />
              <TD
                // innerRef={tdRef}
                value={
                  <div className='flex flex-col'>
                    <Button>accept</Button>
                    <Button>block</Button>
                  </div>
                }
              />
            </TR>
          </TbodyWrapper>
        </Table>
        <Table>
          <TheadWrapper color='thead-dark'>
            <TR>
              <TH>test1</TH>
              <TH>test2</TH>
              <TH>test3</TH>
              <TH>test4</TH>
              {/* <TH height={thHeight}>승인</TH> */}
            </TR>
          </TheadWrapper>
          <TbodyWrapper>
            <TR>
              <TD value={<div>body</div>} />
              <TD value={<div>body</div>} />
              <TD value={<div>body</div>} />
              <TD
                // innerRef={tdRef}
                value={
                  <div className='flex flex-col'>
                    <Button>accept</Button>
                    <Button>block</Button>
                  </div>
                }
              />
            </TR>
          </TbodyWrapper>
        </Table>
      </TableTotal>

      {/* <SliderTwoWayTypeWrapper label='two way'>
                <Slider
                  sliderType='twoPointsChild'
                  name='slider'
                  min={10}
                  max={100}
                  step={10}
                  label='slider '
                  value={formik.values.slider}
                  onChange={formik.handleChange}
                />
                <Slider
                  sliderType='twoPointsChild'
                  name='slider1'
                  min={10}
                  max={100}
                  step={10}
                  label='slider1 '
                  value={formik.values.slider1}
                  onChange={formik.handleChange}
                />
              </SliderTwoWayTypeWrapper> */}

      <br />
      <br />
      <br />
      <br />

      <TwoPointsSlider
        minName='twoMin'
        maxName='twoMax'
        min={10}
        max={100}
        onChange={formik.handleChange}
      />

      {/* test ends */}
    </>
  );
};
export default Test;
