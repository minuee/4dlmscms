import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';

import { showNotification, validationSchema } from '@/utils/commonFn';

import { LOGIN } from '@/settings/constants';
import { stateType } from '@/pages/Auth/Login';

import { PageLoaderModal } from 'comp/PageLoader/PageLoaderModal';

import { useUpdatePasswordWithCodeRequest } from '@/apis/auth/updatePasswordWithCode';

import Button from 'comp/Button/Button';
import Input from 'comp/Input/InputText';

interface IF {}

type initialValues = {
  email?: string;
  authCode?: string;
  newPassword?: string;
  newPasswordCheck?: string;
};

const UpdatePasswordWithCode: React.FC<IF> = (props: IF) => {
  const history = useHistory();
  const { t, i18n } = useTranslation();
  const location = useLocation<stateType>();
  const [email, setEmail] = useState<string>('');
  const {
    handleUpdatePasswordRequest,
    isLoading,
  } = useUpdatePasswordWithCodeRequest();

  useEffect(() => {
    try {
      setEmail(location.state.detail.email);
    } catch (error) {}
  }, [location]);

  useEffect(() => {
    if (email) formik.setValues({ ...formik.values, email });
  }, [email]);

  const handleCancel = () => history.goBack();

  const validateForm = async (values) => {
    // console.log(values);
    const errors: initialValues = {};
    const formSchema = validationSchema('UpdatePasswordWithCode');

    // email check
    const emailError = await formSchema
      .pick(['email'])
      .validate({ email: values.email })
      .catch((err) => {
        // console.log('email: ', err);

        showNotification(err.errors[0], 'error');
        return err.errors[0];
      });

    if (!emailError.email) errors.email = emailError;

    // auth code check
    const authCodeError = await formSchema
      .pick(['authCode'])
      .validate({ authCode: values.authCode })
      .catch((err) => {
        showNotification(err.errors[0], 'error');
        return err.errors[0];
      });

    if (!authCodeError.authCode) errors.authCode = authCodeError;

    // newPasswordError check
    const newPasswordError = await formSchema
      .pick(['newPassword'])
      .validate({ newPassword: values.newPassword })
      .catch((err) => {
        showNotification(err.errors[0], 'error');
        return err.errors[0];
      });

    if (!newPasswordError.newPassword) errors.newPassword = newPasswordError;

    // newPasswordErrorCheck check
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

  const formik = useFormik({
    validateOnChange: false,
    validateOnBlur: false,
    validate: validateForm,
    initialValues: {
      email: '',
      authCode: '',
      newPassword: '',
      newPasswordCheck: '',
    },
    onSubmit: (values: initialValues) => {
      handleSubmit(values);
    },
  });

  const handleSubmit = async (values) => {
    const result = await handleUpdatePasswordRequest(values);
    if (!result) return;

    setTimeout(() => {
      history.push({
        pathname: LOGIN,
        state: {
          detail: {
            email: values.email,
            reset: true,
          },
        },
      });
    }, 1000);
  };

  return (
    <div className='my-auto mx-auto xl:ml-20 bg-dark-1 xl:bg-transparent px-5 sm:px-8 py-8 xl:p-0 rounded-md shadow-md xl:shadow-none w-full sm:w-3/4 lg:w-2/4 xl:w-auto'>
      <h2 className='intro-x font-bold text-2xl xl:text-3xl text-center xl:text-left'>
        Update your password
      </h2>

      <form onSubmit={formik.handleSubmit}>
        <div className='intro-x mt-8'>
          <Input
            name='email'
            placeholder='email'
            type='email'
            onClick={(e) => resetError(e)}
            onChange={formik.handleChange}
            errMsg={formik.errors.email}
            value={formik.values.email}
          />
          <Input
            name='authCode'
            placeholder='confirm code'
            onClick={(e) => resetError(e)}
            onChange={formik.handleChange}
            errMsg={formik.errors.authCode}
            value={formik.values.authCode}
          />
          <Input
            name='newPassword'
            type='password'
            placeholder='password'
            onClick={(e) => resetError(e)}
            onChange={formik.handleChange}
            errMsg={formik.errors.newPassword}
            value={formik.values.newPassword}
          />
          <Input
            name='newPasswordCheck'
            type='password'
            placeholder='password check'
            onClick={(e) => resetError(e)}
            onChange={formik.handleChange}
            errMsg={formik.errors.newPasswordCheck}
            value={formik.values.newPasswordCheck}
          />
        </div>

        <div className='btns-wrapper-align-left'>
          <Button
            type='submit'
            color='btn-primary'
            AlignLeft='btns-wrapper-align-left-top'
          >
            Change
          </Button>
          <Button
            type='button'
            outline='btn-outline-secondary'
            AlignLeft='btns-wrapper-align-left-bottom'
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </div>
      </form>

      <PageLoaderModal isOpen={isLoading} />
    </div>
  );
};
export default UpdatePasswordWithCode;
