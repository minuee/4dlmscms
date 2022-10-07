import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import { showNotification, validationSchema, getLocaleInfo, getFutureDate } from '@/utils/commonFn';
import { UserProps } from '@/components/User/User';

import { useUserMgtRequest } from '@/apis/user/userMgt';
import { useValidation } from '@/hooks/validation-hooks';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { User as USER, addUser } from '@/redux/Auth/authSlices';
import { TOKEN_EXPIRE } from '@/settings/constants';

import Input from 'comp/Input/InputText';
import { PageLoaderModal } from 'comp/PageLoader/PageLoaderModal';
interface registerProps {  
  btnText: string;
  selectedUser?: UserProps;
  handleClose: () => void;
}

const Register = (props: registerProps) => {
  const user = useAppSelector((state: ReducerType): USER => state.users.authUser);
  const { t } = useTranslation();

  const { handleAddNewUserRequest, isLoading } = useUserMgtRequest();
  const { validateFormData } = useValidation();
  
  const [locale, setLocale] = useState<string>('en-US');
  const dispatch = useAppDispatch();

  const formik = useFormik({
    initialValues: {
      userName: '',
      email: '',
      password: '',
      passwordCheck: '',
    },
    validationSchema: validationSchema('AddNewUser'),
    onSubmit: (values) => { handleRegister(values); },
    validateOnChange: false,
    validateOnBlur: false,
  });  

  const handleRegister = async (values: typeof formik.initialValues) => {
    let totalErr = await validateFormData(
      ['passwordCheck'],
      'AddNewUser',
      values,
      'auth'
    );   
    
    if (values.password !== values.passwordCheck) {
      formik.setFieldError('passwordCheck', 'passwordNotMatch');
      totalErr = { ...totalErr, passwordCheck: 'passwordNotMatch' };
      showNotification(t('auth:passwordNotMatch'), 'error');
    }
    
    formik.setErrors(totalErr);

    // 에러가 있으면 저장요청을 하지 못하게 리턴한다.
    if (Object.keys(totalErr).length !== 0) return;

    const result = await handleAddNewUserRequest(values.userName, values.email, values.password, locale);
    if (!result) return;

    formik.setFieldValue('userName', '', false);
    formik.setFieldValue('email', '', false);
    formik.setFieldValue('password', '', false);
    formik.setFieldValue('passwordCheck', '', false);

    if(result && result !== '') {
      const expiry = getFutureDate(TOKEN_EXPIRE);
      const updateUser = {
        ...user, 
        token: result,
        tokenExpirationDate: expiry
      };
      dispatch(addUser(updateUser));
    }

    props.handleClose();
  };

  const resetError = (e) => {
    const name = e.target.name;
    formik.setErrors({ ...formik.errors, [name]: '' });
  };

  // 유저의 로케일 정보를 받아옴
  useEffect(() => {
    const language = getLocaleInfo();
    setLocale(language);
  }, []);

  return (
    <>
      <div className='w-full mx-auto rounded-md shadow-md bg-dark-1 xl:bg-transparent xl:shadow-none '>
        <form onSubmit={formik.handleSubmit}>
          <div className='intro-x'>
            <Input
              name='userName'
              type='text'
              placeholder='Name'
              onClick={resetError}
              onChange={formik.handleChange}
              errMsg={formik.errors.userName}
              value={formik.values.userName || ''}
            />
            <Input              
              name='email'
              type='text'
              placeholder='Email'
              errMsg={formik.errors.email}
              onClick={resetError}
              onChange={formik.handleChange}
              value={formik.values.email || ''}
            />
            <Input              
              name='password'
              type='password'
              placeholder='password'
              errMsg={formik.errors.password}
              onClick={resetError}
              onChange={formik.handleChange}
              value={formik.values.password || ''}
            /> 
            <Input
              name='passwordCheck'
              type='password'
              placeholder='Password Confirmation'
              errMsg={formik.errors.passwordCheck}
              onClick={resetError}
              onChange={formik.handleChange}
              value={formik.values.passwordCheck || ''}
            />
            <Input    
              readonly          
              name='language'
              type='text'
              placeholder='Language'
              value={locale || ''}
              onClick={resetError}
            /> 
          </div>          
          <div className='mt-10 text-center intro-x'>
            <button className='w-full px-4 py-3 align-top btn btn-primary xl:w-32' type='submit'>
              {props.btnText}
            </button>            
          </div>
        </form>
        <PageLoaderModal isOpen={isLoading} />
      </div>
    </>
  );
};

export default Register;
