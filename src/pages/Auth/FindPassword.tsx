import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';

import {
  showNotification,
  validationSchema,
  getLocaleInfo,
} from '@/utils/commonFn';
import { CHANGE_PASSWORD_WITH_CODE } from 'sets/constants';

import { useFindPasswordRequest } from '@/apis/auth/findPassword';

import Button from 'comp/Button/Button';
import Input from 'comp/Input/InputText';
import { PageLoaderModal } from 'comp/PageLoader/PageLoaderModal';

interface Props {}

type InitialValuesType = {
  email?: String;
};

const FindPassword: React.FC<Props> = (props: Props) => {
  const { t } = useTranslation();
  const history = useHistory();
  const { handleRequestFindPassword, isLoading } = useFindPasswordRequest();

  const [locale, setLocale] = useState<string>('ko-KR');

  // 유저의 로케일 정보를 받아옴
  useEffect(() => {
    const language = getLocaleInfo();
    setLocale(language);
  }, []);

  const handleCancel = () => history.goBack();

  const validateForm = async (values) => {
    let errors: InitialValuesType = {};
    const formSchema = validationSchema('ResetPassword');

    const emailError = await formSchema
      .pick(['email'])
      .validate({ email: values.email })
      .catch((err) => {
        showNotification(err.errors[0], 'error');
        return err.errors[0];
      });

    if (!emailError.email) errors.email = emailError;

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
    },
    onSubmit: (values) => {
      handleSubmit(values);
    },
  });

  const handleSubmit = async (values) => {
    const result = await handleRequestFindPassword(values, locale);
    if (!result) return;

    setTimeout(() => {
      history.push({
        pathname: CHANGE_PASSWORD_WITH_CODE,
        state: {
          detail: {
            email: values.email,
          },
        },
      });
    }, 1000);
  };

  return (
    <div className='my-auto mx-auto xl:ml-20 bg-dark-1 xl:bg-transparent px-5 sm:px-8 py-8 xl:p-0 rounded-md shadow-md xl:shadow-none w-full sm:w-3/4 lg:w-2/4 xl:w-auto'>
      <h2 className='intro-x font-bold text-2xl xl:text-3xl text-center xl:text-left'>
        Reset Password
      </h2>
      <p className='block intro-x mt-2 text-gray-500 xl:hidden text-center'>
        Enter your email address and we'll send you a code to regain access to
        your account.
      </p>

      <form onSubmit={formik.handleSubmit}>
        <div className='intro-x mt-8'>
          <Input
            name='email'
            placeholder='email'
            onClick={(e) => resetError(e)}
            onChange={formik.handleChange}
            errMsg={formik.errors.email}
          />
        </div>
        <div className='btns-wrapper-align-left'>
          <Button
            type='submit'
            color='btn-primary'
            AlignLeft='btns-wrapper-align-left-top'
          >
            Send Code
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

export default FindPassword;
