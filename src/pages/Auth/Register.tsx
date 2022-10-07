import React, { useState, useEffect } from 'react';
import { Link, useHistory, useLocation, Prompt } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import { showNotification, checkPasswordStrength } from '@/utils/commonFn';

import { LOGIN } from 'sets/constants';

import { useRegisterRequest } from '@/apis/auth/register';
import { useValidation } from '@/hooks/validation-hooks';

import Button from 'comp/Button/Button';
import Input from 'comp/Input/InputText';
import Checkbox from 'comp/Input/Checkbox';
import { PageLoaderModal } from 'comp/PageLoader/PageLoaderModal';

interface stateType {
  detail: {
    email: string;
    locale: string;
  };
}

const Register: React.FC = () => {
  const { t } = useTranslation();

  const history = useHistory();
  const location = useLocation<stateType>();

  const [email, setEmail] = useState<string>('');
  const [language, setLanguage] = useState<string>('');
  const [strength, setStrength] = useState<number>(0);

  const { handleRegisterRequest, isLoading } = useRegisterRequest();
  const { validateFormData } = useValidation();

  const formik = useFormik({
    initialValues: {
      authCode: '',
      language: language,
      userName: '',
      email: email,
      password: '',
      passwordCheck: '',
      agreePolicy: false,
    },
    // validationSchema: validationSchema('UserRegister'),
    onSubmit: (values) => {
      handleRegister(values);
    },
    validateOnChange: false,
    validateOnBlur: false,
  });

  useEffect(() => {
    if (!location || !location.state) return;
    const authEmail = location.state.detail;
    const message = t('auth:checkEmailAuthCode');
    if (!authEmail) return;
    setEmail(authEmail.email);
    formik.setFieldValue('email', authEmail.email, false);
    setLanguage(authEmail.locale);
    showNotification(message, 'info');
  }, []);

  const handleRegister = async (values: typeof formik.initialValues) => {
    let totalErr = await validateFormData(
      ['language', 'passwordCheck'],
      'UserRegister',
      values,
      'auth'
    );
    if (values.password !== values.passwordCheck) {
      formik.setFieldError('passwordCheck', 'passwordNotMatch');
      totalErr = { ...totalErr, passwordCheck: 'passwordNotMatch' };
      showNotification(t('auth:passwordNotMatch'), 'error');
    }
    if (values.agreePolicy !== true) {
      formik.setFieldError('agreePolicy', 'agreePolicyRequired');
      totalErr = { ...totalErr, agreePolicy: 'agreePolicyRequired' };
      showNotification(t('auth:agreePolicyRequired'), 'error');
    }
    formik.setErrors(totalErr);

    // 에러가 있으면 저장요청을 하지 못하게 리턴한다.
    if (Object.keys(totalErr).length !== 0) return;

    const result = await handleRegisterRequest(values, email);
    if (!result) return;

    history.push({
      pathname: LOGIN,
      state: {
        detail: {
          _id: result._id,
          email: result.email,
        },
      },
    });
  };

  const resetError = (e) => {
    const name = e.target.name;
    formik.setErrors({ ...formik.errors, [name]: '' });
  };

  const handleLogin = () => history.push(LOGIN);

  const handlePasswordChange = (e) => {
    formik.handleChange(e);

    const strength = checkPasswordStrength(e.target.value);
    setStrength(strength);
  };

  return (
    <>
      <Prompt message={t('auth:canNotUseThisEmailIfLeaveThisPage')} />
      <div className='my-auto mx-auto xl:ml-20 bg-dark-1 xl:bg-transparent px-5 sm:px-8 py-8 xl:p-0 rounded-md shadow-md xl:shadow-none w-full sm:w-3/4 lg:w-2/4 xl:w-auto'>
        <form onSubmit={formik.handleSubmit}>
          <h2 className='intro-x font-bold text-2xl xl:text-3xl text-center xl:text-left'>
            Sign Up
          </h2>
          <p className='intro-x mt-2 text-gray-500 xl:hidden text-center'>
            A few more clicks to sign in to your account.
          </p>
          <div className='intro-x mt-8'>
            <Input
              name='authCode'
              type='text'
              placeholder='Email Authentication Code'
              maxLength={6}
              errMsg={formik.errors.authCode}
              onClick={resetError}
              onChange={formik.handleChange}
              value={formik.values.authCode || ''}
            />

            <Input
              name='userName'
              type='text'
              placeholder='User Name'
              onClick={resetError}
              onChange={formik.handleChange}
              errMsg={formik.errors.userName}
              value={formik.values.userName || ''}
            />
            <Input
              readonly
              name='email'
              type='text'
              placeholder='Email'
              errMsg={formik.errors.email}
              onClick={resetError}
              onChange={formik.handleChange}
              value={email}
            />
            <Input
              name='password'
              type='password'
              placeholder='Password'
              errMsg={formik.errors.password}
              onClick={resetError}
              onChange={(e) => handlePasswordChange(e)}
              value={formik.values.password || ''}
            />
            <div className='intro-x w-full grid grid-cols-12 gap-4 h-1 mt-3'>
              <div
                className={`col-span-3 h-full rounded ${
                  strength > 1 ? 'bg-theme-10' : 'bg-dark-2'
                }`}
              ></div>
              <div
                className={`col-span-3 h-full rounded ${
                  strength > 2 ? 'bg-theme-10' : 'bg-dark-2'
                }`}
              ></div>
              <div
                className={`col-span-3 h-full rounded ${
                  strength > 3 ? 'bg-theme-10' : 'bg-dark-2'
                }`}
              ></div>
              <div
                className={`col-span-3 h-full rounded ${
                  strength > 4 ? 'bg-theme-10' : 'bg-dark-2'
                }`}
              ></div>
            </div>
            <div className='intro-x text-gray-600 block mt-2 text-xs sm:text-sm'>
              What is your password strength?
            </div>

            <Input
              name='passwordCheck'
              type='password'
              placeholder='Password Confirmation'
              errMsg={formik.errors.passwordCheck}
              onClick={resetError}
              onChange={formik.handleChange}
              value={formik.values.passwordCheck || ''}
            />
          </div>
          <div className='intro-x flex items-center text-gray-600 mt-4 text-xs sm:text-sm'>
            <Checkbox
              id='agree-policy'
              name='agreePolicy'
              checked={formik.values.agreePolicy}
              label={
                <label
                  className='cursor-pointer select-none'
                  htmlFor='agree-policy'
                >
                  I agree to the 4DReplay
                </label>
              }
              onChange={formik.handleChange}
            />
            <Link to={'#'} className='text-gray-300 ml-1'>
              Privacy Policy
            </Link>
            .
          </div>
          <div className='intro-x mt-5 xl:mt-8 text-center xl:text-left'>
            <button
              className='btn btn-primary py-3 px-4 w-full xl:w-32 xl:mr-3 align-top'
              type='submit'
            >
              Register
            </button>
            <button
              className='btn btn-outline-secondary py-3 px-4 w-full xl:w-32 mt-3 xl:mt-0 align-top'
              onClick={handleLogin}
            >
              Sign in
            </button>
          </div>
        </form>
        <PageLoaderModal isOpen={isLoading} />
      </div>
    </>
  );
};

export default Register;
