import React, { useEffect, useContext, useCallback } from 'react';
import { Link, useHistory, useLocation, Redirect } from 'react-router-dom';
import { AuthContext } from 'cont/auth';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import { showNotification, validationSchema } from '@/utils/commonFn';

import { useLoginRequest } from '@/apis/auth/login';

import {
  CMS_CONTENT,
  FIND_PASSWORD,
  AUTH_EMAIL,
  CREATE_2FACTOR,
  VERIFY_2FACTOR,
} from 'sets/constants';

import { PageLoaderModal } from 'comp/PageLoader/PageLoaderModal';

export interface stateType {
  detail: {
    _id: string;
    email: string;
    reset?: boolean;
  };
}

export interface LoginSuccessStateType {
  detail: {
    _id: string;
    temp_token: string;
    otp_secret?: string;
  };
}

export default function Login() {
  const { authenticate, isAuthenticated } = useContext(AuthContext);
  if (isAuthenticated) return <Redirect to={{ pathname: CMS_CONTENT }} />;

  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation<stateType>();

  const { handleRequestLogin, isLoading } = useLoginRequest();

  const handleGoTo2Factor = (userData) => {
    // need일 때랑 아닐 때 구분하여 페이지를 이동한다.
    const pathname =
      userData.mfa_info === 'need' ? CREATE_2FACTOR : VERIFY_2FACTOR;
    history.replace({
      pathname,
      state: {
        detail:
          userData.mfa_info === 'need'
            ? {
                _id: userData._id,
                temp_token: userData.temp_token,
              }
            : //  need가 아닐 때는 otp_secret 정보도 같이 넘긴다.
              {
                _id: userData._id,
                temp_token: userData.temp_token,
                otp_secret: userData.mfa_info,
              },
      },
    });
  };

  const handleLogin = useCallback(async (values) => {
    const result = await handleRequestLogin(values.email, values.password);
    if (result) handleGoTo2Factor(result);
  }, []);

  const resetError = (e) => {
    const name = e.target.name;
    formik.setErrors({ ...formik.errors, [name]: '' });
  };

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: validationSchema('Login'),
    onSubmit: (values) => {
      handleLogin(values);
    },
    validateOnChange: false,
    validateOnBlur: false,
  });

  useEffect(() => {
    if (location && location.state) {
      const authEmail = location.state.detail;
      if (authEmail) {
        formik.values.email = authEmail.email;

        let message = authEmail.reset
          ? t('auth:resetPasswordCompleted')
          : t('auth:welcomeSignup');
        showNotification(message, 'success');
      }
    }
  }, []);

  useEffect(() => {
    if (formik.touched.email && formik.errors.email) {
      showNotification(formik.errors.email, 'error');
    }

    if (formik.touched.password && formik.errors.password) {
      showNotification(formik.errors.password, 'error');
    }
  }, [formik.submitCount, formik.errors]);

  // const handleAuthEmail = () => history.push(AUTH_EMAIL);

  return (
    <div className='w-full px-5 py-8 mx-auto my-auto rounded-md shadow-md xl:ml-20 bg-dark-1 xl:bg-transparent sm:px-8 xl:p-0 xl:shadow-none sm:w-3/4 lg:w-2/4 xl:w-auto'>
      <h2 className='text-2xl font-bold text-center intro-x xl:text-3xl xl:text-left'>
        Sign In00000
      </h2>
      <div className='mt-2 text-center text-gray-500 intro-x xl:hidden'>
        A few more clicks to sign into your account.
      </div>
      <form onSubmit={formik.handleSubmit}>
        <div className='mt-8 intro-x'>
          <div
            className={`${
              formik.touched.email && formik.errors.email ? 'has-error' : ''
            }`}
          >
            <input
              name='email'
              type='text'
              autoComplete='on'
              className='block px-4 py-3 intro-x login__input form-control'
              placeholder='Email'
              onChange={formik.handleChange}
              onClick={(e) => resetError(e)}
              value={formik.values.email || ''}
            />
          </div>
          <div
            className={`${
              formik.touched.password && formik.errors.password
                ? 'has-error'
                : ''
            }`}
          >
            <input
              name='password'
              type='password'
              autoComplete='current-password'
              className='block px-4 py-3 mt-4 intro-x login__input form-control'
              placeholder='Password'
              onChange={formik.handleChange}
              onClick={(e) => resetError(e)}
            />
          </div>
        </div>
        <div className='flex justify-between mt-4 text-xs text-gray-600 intro-x sm:text-sm'>
          {/* <div className='flex items-center mr-auto'></div> */}
          <Link to={FIND_PASSWORD}>Forgot Password?</Link>
          <button className='w-32 btn btn-primary' type='submit'>
            Login
          </button>
        </div>
        {/* <div className='mt-5 text-center intro-x xl:mt-8 xl:text-left'>
          <button
            className='w-full px-4 py-3 align-top btn btn-primary xl:w-32 xl:mr-3'
            type='submit'
          >
            Login
          </button>
          <button
            type='button'
            className='w-full px-4 py-3 mt-3 align-top btn btn-outline-secondary xl:w-32 xl:mt-0'
            onClick={handleAuthEmail}
          >
            Sign up
          </button>
        </div> */}
      </form>
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
      <PageLoaderModal isOpen={isLoading} />
    </div>
  );
}
