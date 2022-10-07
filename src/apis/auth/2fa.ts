import {
  showNotification,
  currentDateTime,
  getFutureDate,
} from '@/utils/commonFn';

import { create_2fa_for_token, verify_2fa_for_token } from '@/graphQL/auth';
import { User } from '@/redux/Auth/authSlices';
import { useCustomAxios } from '@/hooks/axios-hooks';
import { TOKEN_EXPIRE } from '@/settings/constants';

export const use2FaRequest = () => {
  const { isLoading, sendRequest } = useCustomAxios();

  const handleRequestCreate2Fa = async (_id, temp_token) => {
    const data = {
      query: create_2fa_for_token,
      variables: {
        _id,
        temp_token,
      },
    };

    const options = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const responseData = await sendRequest(
        undefined,
        undefined,
        data,
        options,
        'create_2fa_for_token',
        true
      );

      if (responseData.result === 'ok') {
        const data = responseData.data;
        return data;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleRequestVerify2Fa = async (values, locationData, qrScrete) => {
    const data = {
      query: verify_2fa_for_token,
      variables: {
        _id: locationData._id,
        otp_token: values.code.trim(),
        otp_secret: qrScrete,
        temp_token: locationData.temp_token,
      },
    };

    const options = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const responseData = await sendRequest(
        undefined,
        undefined,
        data,
        options,
        'verify_2fa_for_token',
        false
      );

      if (responseData.result !== 'ok') return;

      const userData = responseData.data.user_info;

      // const now = new Date();
      // 내일(토큰은 발급기준으로 24시간 지속되므로 만료일 데이터로 아래 변수를 넣는다.)
      // 0924 한 달 뒤로 변경 됨
      const expiry = getFutureDate(TOKEN_EXPIRE);
      // console.log(expiry.toISOString());

      // 리듀서에 정보 저장 후
      // 로그인 완료, 대시 보드로 이동
      const userInfo: User = {
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        state: userData.state,
        token: responseData.data.token,
        tokenExpirationDate: expiry,
        recentLogin: userData.recent_login,
        currentLogin: currentDateTime(),
        createdAt: userData.createdAt,
        language: userData.language[0],
      };
      // authenticate(, history.push(DASHBOARD));
      return userInfo;
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  return { handleRequestCreate2Fa, handleRequestVerify2Fa, isLoading };
};
