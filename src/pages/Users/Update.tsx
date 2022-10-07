import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import { validationSchema, getLocaleInfo, getFutureDate } from '@/utils/commonFn';
import { UserProps } from '@/components/User/User';

import { useUserMgtRequest } from '@/apis/user/userMgt';
import { useValidation } from '@/hooks/validation-hooks';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { User as USER, addUser } from '@/redux/Auth/authSlices';
import { TOKEN_EXPIRE } from '@/settings/constants';

import Input from 'comp/Input/InputText';
import Select, { Option } from 'comp/Input/Select';
import { USER_TYPE } from '@/settings/cmsOptionsData';

import { PageLoaderModal } from 'comp/PageLoader/PageLoaderModal';
import { ModalType } from './index';
interface updateProps {
  type: string;
  btnText: string;
  selectedUser?: UserProps;
  handleClose: () => void;
}

const Update = (props: updateProps) => {
  const user = useAppSelector((state: ReducerType): USER => state.users.authUser);

  const { t } = useTranslation();

  const { handleUpdateUserRequest, handleDeleteUserRequest, isLoading } = useUserMgtRequest();
  const { validateFormData } = useValidation();
  
  const [locale, setLocale] = useState<string>('en-US');

  const dispatch = useAppDispatch();

  const formik = useFormik({
    initialValues: {
      userName: props.selectedUser? props.selectedUser.name : '',
      email: props.selectedUser? props.selectedUser.email : '',
      role: props.selectedUser? props.selectedUser.state: 2,
    },
    validationSchema: validationSchema('UpdateUser'),
    onSubmit: (values) => { handleRegister(values); },
    validateOnChange: false,
    validateOnBlur: false,
  });  

  const handleRegister = async (values: typeof formik.initialValues) => {
    let result;
    if (props.type === ModalType.UPDATE_USER) {
      let totalErr = await validateFormData(
        ['role'],
        'UpdateUser',
        values,
        'auth'
      );    
      formik.setErrors(totalErr);

      // 에러가 있으면 저장요청을 하지 못하게 리턴한다.
      if (Object.keys(totalErr).length !== 0) return;
      result = await handleUpdateUserRequest(values.userName, values.email, Number(values.role));      
    } else {
      result = await handleDeleteUserRequest(values.email);
    }

    console.log(result);
    if (!result) return;

    formik.setFieldValue('userName', '', false);
    formik.setFieldValue('email', '', false); 
    formik.setFieldValue('role', '', false); 

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

  useEffect(() => {
    let name = '', email = '', state = 2;
    if(props.selectedUser) {
      name = props.selectedUser.name;
      email = props.selectedUser.email;
      state = props.selectedUser.state;
    } 

    formik.setFieldValue('userName', name, false);
    formik.setFieldValue('email', email, false); 
    formik.setFieldValue('role', state, false);

  }, [props.selectedUser]);

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
              placeholder='User Name'
              onClick={resetError}
              onChange={formik.handleChange}
              errMsg={formik.errors.userName}
              value={formik.values.userName || ''}
            />
            <Input              
              name='email'
              type='text'
              placeholder='User Email'
              errMsg={formik.errors.email}
              onClick={resetError}
              onChange={formik.handleChange}
              value={formik.values.email || ''}
            />
            <Select
              name='role'
              id='role'
              onChange={formik.handleChange}
              onClick={(e) => resetError(e)}
              errMsg={formik.errors.role}
              value={formik.values.role || ''}
              label={t('user:role')}
            >
              <option value='' disabled hidden>
                {t('user:selectRole')}
              </option>
              {USER_TYPE &&
                USER_TYPE?.map((type) => {
                  return (
                    <Option
                      key={type.value}
                      value={type.value}
                      label={type.label}
                    />
                  );
                })}
            </Select>          </div>          
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

export default Update;
