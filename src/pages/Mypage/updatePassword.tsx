import React, { useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';

import {
  showNotification,
  validationSchema,
  classNames,
} from '@/utils/commonFn';

import { useAppSelector } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { User } from '@/redux/Auth/authSlices';

import { PageLoaderModal } from 'comp/PageLoader/PageLoaderModal';

import { user_password_change } from '@/graphQL/mypage';
import { useCustomAxios } from '@/hooks/axios-hooks';

import { MYPAGE } from 'sets/constants';

import Button from 'comp/Button/Button';
import Input from 'comp/Input/InputText';

interface UpdatePasswordProps {}

const UpdatePassword: React.FC<UpdatePasswordProps> = (
  props: UpdatePasswordProps
) => {
  const history = useHistory();
  const { t, i18n } = useTranslation();
  const user = useAppSelector(
    (state: ReducerType): User => state.users.authUser
  );
  const { isLoading, sendRequest } = useCustomAxios();

  const handleCancel = useCallback(() => history.goBack(), []);

  type InitialValues = {
    oldPassword?: String;
    newPassword?: String;
    newPasswordCheck?: String;
  };

  const validateForm = async (values) => {
    let errors: InitialValues = {};
    const formSchema = validationSchema('UpdatePassword');

    const oldPasswordError = await formSchema
      .pick(['oldPassword'])
      .validate({ oldPassword: values.oldPassword })
      .catch((err) => {
        showNotification(err.errors[0], 'error');
        return err.errors[0];
      });

    if (!oldPasswordError.oldPassword) errors.oldPassword = oldPasswordError;

    const newPasswordError = await formSchema
      .pick(['newPassword'])
      .validate({ newPassword: values.newPassword })
      .catch((err) => {
        showNotification(err.errors[0], 'error');
        return err.errors[0];
      });
    if (!newPasswordError.newPassword) errors.newPassword = newPasswordError;

    const newPasswordCheckError = await formSchema
      .pick(['newPassword', 'newPasswordCheck'])
      .validate({
        newPassword: values.newPassword,
        newPasswordCheck: values.newPasswordCheck,
      })
      .catch((err) => {
        showNotification(err.errors[0], 'error');
        return err.errors[0];
      });
    if (!newPasswordCheckError.newPasswordCheck)
      errors.newPasswordCheck = newPasswordCheckError;

    return errors;
  };

  const resetError = (e) => {
    const name = e.target.name;
    formik.setErrors({ ...formik.errors, [name]: '' });
  };

  // ***** Formik logics
  const formik = useFormik({
    initialValues: {
      oldPassword: '',
      newPassword: '',
      newPasswordCheck: '',
    },
    validate: validateForm,
    onSubmit: async (values) => {
      //  서버에 업데이트 요청
      const data = {
        query: user_password_change,
        variables: {
          _id: user._id,
          pre_password: values.oldPassword,
          next_password: values.newPassword,
        },
      };
      // console.log(`data.variables: `, data.variables);

      const options = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: user.token,
        },
      };

      try {
        const responseData = await sendRequest(
          // '/ims/v0/meta/ql',
          '/gql/user',
          'post',
          data,
          options,
          'user_password_change',
          false
        );
        // console.log('responseData onSubmit: ', responseData);

        if (responseData.result === 'ok') {
          setTimeout(() => {
            history.push({
              pathname: MYPAGE,
            });
          }, 1000);
        }
      } catch (error) {
        console.log(error);
      }
    },

    validateOnChange: false,
    validateOnBlur: false,
  });

  return (
    <>
      <div className='intro-y flex items-center mt-8'>
        <h2 className='text-lg font-medium mr-auto'>Change Password</h2>
      </div>

      <form onSubmit={formik.handleSubmit}>
        <div className='list__body__wrapper'>
          <div className='intro-y col-span-12 lg:col-span-6'>
            <div className='intro-y box p-5'>
              <Input
                id='update-profile--oldPassword'
                name='oldPassword'
                type='password'
                placeholder='Old Password'
                onClick={(e) => resetError(e)}
                onChange={formik.handleChange}
                errMsg={formik.errors.oldPassword}
                label='Old Password'
                noLabelMargin
                autoComplete='off'
              />

              <Input
                id='update-profile--newPassword'
                name='newPassword'
                type='password'
                placeholder='New Password'
                onClick={(e) => resetError(e)}
                onChange={formik.handleChange}
                errMsg={formik.errors.newPassword}
                label='New Password'
                autoComplete='off'
              />

              <Input
                id='update-profile--newPasswordCheck'
                name='newPasswordCheck'
                type='password'
                placeholder='Confirm Password'
                onClick={(e) => resetError(e)}
                onChange={formik.handleChange}
                errMsg={formik.errors.newPasswordCheck}
                label='New Password'
                autoComplete='off'
              />

              <div className='btns-wrapper-align-right mt-3'>
                <Button color='btn-secondary' onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type='submit' color='btn-primary'>
                  Change Password
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
      <PageLoaderModal isOpen={isLoading} />
    </>
  );
};
export default UpdatePassword;
