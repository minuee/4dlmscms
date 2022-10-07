import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import { showNotification, validationSchema, getLocaleInfo } from '@/utils/commonFn';
import { REGISTER } from 'sets/constants';
import { useAuthEmailRequest } from '@/apis/auth/authEmail';

import { PageLoaderModal } from 'comp/PageLoader/PageLoaderModal';

export default function AuthEmail() {
  const history = useHistory();

  const { handleAuthEmail, isLoading } = useAuthEmailRequest();

  const formik = useFormik({
    initialValues: {
      email: '',
      locale: 'ko-KR',
    },
    validationSchema: validationSchema('AuthEmail'),    
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: (values) => {
      handleSubmit(values);
    },
  });

  const handleSubmit = async (values: typeof formik.initialValues) => {
    const result = await handleAuthEmail(values.email, values.locale);
    if (!result) return;

    history.push({
      pathname: REGISTER,
      state: {
        detail: {
          email: values.email,
          locale: values.locale,
        },
      },
    });
  };

  const resetError = (e) => {
    const name = e.target.name;
    formik.setErrors({ ...formik.errors, [name]: '' });
  };

  const handleCancel = () => history.goBack();

  useEffect(() => {
    const language = getLocaleInfo();
    const languageForLocalStorgage = language.split('-')[0];
    localStorage.setItem('language', languageForLocalStorgage);
    formik.setFieldValue('locale', language, false);
  }, []);

  useEffect(() => {
    if (formik.touched.email && formik.errors.email) {
      showNotification(formik.errors.email, 'error');
    }
  }, [formik.submitCount, formik.errors]);  

  return (
    <div className='w-full px-5 py-8 mx-auto my-auto rounded-md shadow-md xl:ml-20 bg-dark-1 xl:bg-transparent sm:px-8 xl:p-0 xl:shadow-none sm:w-3/4 lg:w-2/4 xl:w-auto'>
      <form onSubmit={formik.handleSubmit}>
        <h2 className='text-2xl font-bold text-center intro-x xl:text-3xl xl:text-left'>
          Check your email
        </h2>
        <p className='mt-2 text-center text-gray-500 intro-x xl:hidden'>
          Enter your email address and we'll send you a code to authenticate
          your email.
        </p>
        <div className='mt-8 intro-x'>
          <div
            className={`${
              formik.touched.email && formik.errors.email ? 'has-error' : ''
            }`}
          >
            <input
              name='email'
              type='text'
              className='block px-4 py-3 intro-x login__input form-control'
              placeholder='Email'
              onClick={(e) => resetError(e)}
              onChange={formik.handleChange}
              value={formik.values.email || ''}
            />
          </div>
          {/* <input
            name='locale'
            type='text'
            className='block px-4 py-3 mt-4 intro-x login__input form-control'
            placeholder='Language'
            value={formik.values.locale || ''}
            onChange={formik.handleChange}
            readOnly
          /> */}
        </div>
        <div className='mt-5 text-center intro-x xl:mt-8 xl:text-left'>
          <button className='w-full px-4 py-3 align-top btn btn-primary xl:w-32 xl:mr-3' type='submit'>
            Request
          </button>
          <button className='w-full px-4 py-3 mt-3 align-top btn btn-outline-secondary xl:w-32 xl:mt-0' onClick={handleCancel}>
            Cancel
          </button>
        </div>
        <div className='mt-10 text-center text-gray-600 intro-x xl:mt-24 xl:text-left'>
          By signin up, you agree to our
          <br />
          <a className='text-gray-300' href=''>
            Terms and Conditions
          </a>{' '}
          &{' '}
          <a className='text-gray-300' href=''>
            Privacy Policy
          </a>
        </div>
      </form>
      <PageLoaderModal isOpen={isLoading} />
    </div>
  );
}
