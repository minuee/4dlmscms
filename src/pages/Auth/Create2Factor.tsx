import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
  lazy,
} from 'react';
import { useHistory, useLocation, Redirect } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import { VERIFY_2FACTOR, CMS_CONTENT, LOGIN } from 'sets/constants';

import {
  returnIcon,
  showNotification,
  validationSchema,
} from '@/utils/commonFn';
import { AuthContext } from 'cont/auth';

import { use2FaRequest } from '@/apis/auth/2fa';

import { LoginSuccessStateType } from './Login';

import { PageLoaderModal } from 'comp/PageLoader/PageLoaderModal';
const Button = lazy(() => import('comp/Button/Button'));
const Input = lazy(() => import('comp/Input/InputText'));

// 2fa 인증을 요청하는 페이지
interface Create2FactorProps {}

type InitialValuesType = {
  code?: String;
};

const Create2Factor: React.FC<Create2FactorProps> = (
  props: Create2FactorProps
) => {
  const { authenticate, isAuthenticated } = useContext(AuthContext);
  // 이미 QR인증을 한 경우엔 verify 페이지로 보낸다.
  if (isAuthenticated) return <Redirect to={{ pathname: VERIFY_2FACTOR }} />;

  const pathName = useRef<string>(window.location.pathname.toLowerCase());

  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation<LoginSuccessStateType>();
  const [qrSrc, setQrSrc] = useState<string>('');
  const [qrScrete, setQrScrete] = useState<string>('');

  const { handleRequestCreate2Fa, handleRequestVerify2Fa, isLoading } =
    use2FaRequest();

  const setQrData = async (data) => {
    const result = await handleRequestCreate2Fa(data._id, data.temp_token);
    if (!result) return;
    setQrSrc(result?.qr_code_url);
    setQrScrete(result?.qr_secret);
  };

  useEffect(() => {
    if (pathName.current.includes('verify2fa')) {
      const locationData = location.state.detail;
      setQrScrete(locationData.otp_secret);
      return;
    }

    if (!location || !location.state) {
      showNotification(
        'Sign in data has been expired. Please sign in again.',
        'error'
      );
      // CREATE_2FACTOR 페이지로 이동한다.
      history.replace(LOGIN);
    }

    if (location && location.state) {
      const data = location.state.detail;

      // 인증용 큐알코드 등의 정보를 불러와서 세팅한다.
      setQrData(data);
    }
  }, []);

  const validateForm = async (values) => {
    let errors: InitialValuesType = {};
    const formSchema = validationSchema('Verify2Fa');

    const codeError = await formSchema
      .pick(['code'])
      .validate({ code: values.code.trim() })
      .catch((err) => {
        const message = t(`auth:${err.errors[0]}`);
        showNotification(message, 'error');
        return err.errors[0];
      });

    if (!codeError.code) errors.code = codeError;

    return errors;
  };

  const handleCancel = useCallback(() => history.replace(LOGIN), []);

  const handleSubmit = async (values) => {
    const locationData = location.state.detail;

    const result = await handleRequestVerify2Fa(values, locationData, qrScrete);
    if (result) authenticate(result, history.push(CMS_CONTENT));
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
      code: '',
    },
    onSubmit: (values) => {
      handleSubmit(values);
    },
  });

  const requestReIssueQRCode = async () => {
    // history.replace(LOGIN, state:{})
    const data = location.state.detail;

    const result = await handleRequestCreate2Fa(data._id, data.temp_token);
    if (!result) return;
    setQrSrc(result?.qr_code_url);
    setQrScrete(result?.qr_secret);
  };

  return (
    <div className='w-full px-5 py-8 mx-auto my-auto rounded-md shadow-md xl:ml-20 bg-dark-1 xl:bg-transparent sm:px-8 xl:p-0 xl:shadow-none sm:w-3/4 lg:w-2/4 xl:w-auto'>
      <div className='flex items-center justify-center'>
        <h2 className='text-2xl font-bold text-center intro-x xl:text-3xl xl:text-left'>
          Two-Factor Authentification
        </h2>
      </div>

      {!pathName.current.includes('verify2fa') ? (
        <p className='mt-2 text-center text-gray-500 intro-x xl:text-left xl:mt-4'>
          Step 1. Download authentificator app(e.g. Microsoft Authenticator).
          <br />
          Step 2. Scan the presented barcode with the App and enter in the
          corresponding generated code.
        </p>
      ) : (
        <p className='mt-2 text-center text-gray-500 intro-x xl:text-left xl:mt-4'>
          Enter in the corresponding generated code in your authentificator App.
          <br />
          (If you keep failing in authentication,
          <br />
          please click 'need QR code?' text down below to renew your account.)
        </p>
      )}

      <form onSubmit={formik.handleSubmit}>
        <div className='flex flex-col mt-8 intro-x '>
          {!qrSrc ? null : (
            // <div className='w-40 h-40 mx-auto mb-8 bg-gray-700 rounded-sm skeleton'></div>
            <img
              className='mx-auto mb-8 max-w-1/3'
              src={qrSrc}
              alt='QR Code for authentification'
            />
          )}
          <Input
            name='code'
            placeholder='Enter auth code(without any white space)'
            onClick={(e) => resetError(e)}
            onChange={formik.handleChange}
            errMsg={formik.errors.code}
          />
        </div>
        <div className='btns-wrapper-align-right '>
          <Button
            type='button'
            outline='btn-outline-secondary'
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button type='submit' color='btn-primary'>
            Submit
          </Button>
        </div>
        {pathName.current.includes('verify2fa') && (
          <div className='flex items-center'>
            {returnIcon({ icon: 'Info' })}
            <p className='ml-2 cursor-pointer' onClick={requestReIssueQRCode}>
              need QR code?
            </p>
          </div>
        )}
      </form>
      <PageLoaderModal isOpen={isLoading} />
    </div>
  );
};
export default Create2Factor;
