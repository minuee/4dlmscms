import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import { showNotification, validationSchema, getLocaleInfo } from '@/utils/commonFn';

import { useVenueListRequest } from '@/apis/IMS/venue/list';
import { useValidation } from '@/hooks/validation-hooks';

import Input from 'comp/Input/InputText';
import { PageLoaderModal } from 'comp/PageLoader/PageLoaderModal';

interface importExcelProps {
  isOpen: boolean,
  handleClose: (isReload: boolean) => void;
}

const ImportExcel = (props: importExcelProps) => {
  const { t } = useTranslation();

  const { requestExcelImport, isLoading } = useVenueListRequest();
  const { validateFormData } = useValidation();
  
  const [importExcel, setImportExcel] = useState<File>(null);

  const formik = useFormik({
    initialValues: {
      venueId: '',
      systemId: '',
    },
    validationSchema: validationSchema('ImportExcel'),
    onSubmit: (values) => { handleImportExcel(values); },
    validateOnChange: false,
    validateOnBlur: false,
  });  

  const handleImportExcel = async (values: typeof formik.initialValues) => {
    try {
      let totalErr = await validateFormData(
        [],
        'ImportExcel',
        values,
        'ims'
      ); 

      formik.setErrors(totalErr);

      if (Object.keys(totalErr).length !== 0) return;

      if(importExcel) {
        const result = await requestExcelImport(importExcel, values.venueId, values.systemId, 'false');
        //console.log(result);
        //if (!result) return;

        formik.setFieldValue('venueId', '', false);
        formik.setFieldValue('systemId', '', false);
        
        setImportExcel(null);

        //console.log('1111');
        props.handleClose(true);        
      } else {
        showNotification('Please select the import file.', 'error');
        return;
      }
    } catch (err) {
      console.log(err);
    }
  };

  const resetError = (e) => {
    const name = e.target.name;
    formik.setErrors({ ...formik.errors, [name]: '' });
  };

  const handleExcelImport = async (e) => {
    e.preventDefault();

    const file = e.target.files?.item(0);
    const fileType = file.name.split('.').pop();

    if (fileType.toLowerCase() !== 'xlsx') {
      showNotification('pleaseUploadeOnlyXlsxFile', 'error');
      return;
    }

    setImportExcel(file);
  };

  useEffect(() => {
    if(!props.isOpen) {
      formik.setFieldValue('venueId', '', false);
      formik.setFieldValue('systemId', '', false);
      setImportExcel(null);

      formik.setErrors({});
    }
  }, [props.isOpen]);

  return (
    <>
      <div className='w-full mx-auto rounded-md shadow-md bg-dark-1 xl:bg-transparent xl:shadow-none '>
        <form onSubmit={formik.handleSubmit}>
          <div className='intro-x'>
            <Input 
              name='venueId'
              type='text'
              placeholder='Venue Id'
              errMsg={formik.errors.venueId}
              onClick={resetError}
              onChange={formik.handleChange}
              value={formik.values.venueId || ''}
            />
            <Input              
              name='systemId'
              type='text'
              placeholder='System Id'
              errMsg={formik.errors.systemId}
              onClick={resetError}
              onChange={formik.handleChange}
              value={formik.values.systemId || ''}
            /> 
            <div className='mt-3'>
              <label htmlFor='excelFile' className='w-full btn btn-primary'>
                Select Excel File
              </label>
              <input
                id='excelFile'
                className='sr-only'
                type='file'
                name='excelFile'                
                onChange={(e) => {
                  handleExcelImport(e);
                  (e.target as HTMLInputElement).value = null;
                }}
              />
            </div> 
            <div>
              <input
                readOnly
                name='uploadFile'
                type='text'
                className='mr-auto form-control'
                placeholder={'Select Excel File'}
                value={importExcel? importExcel.name : ''}                
              />
            </div>           
          </div>          
          <div className='mt-10 text-center intro-x'>
            <button className='w-full px-4 py-3 align-top btn btn-primary xl:w-32' type='submit'>
              UPLOAD
            </button>            
          </div>
        </form>
        <PageLoaderModal isOpen={isLoading} />
      </div>
    </>
  );
};

export default ImportExcel;
