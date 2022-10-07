import { userRegistrationCode } from '@/graphQL/auth';
import { useCustomAxios } from '@/hooks/axios-hooks';

export const useAuthEmailRequest = () => {
  const { isLoading, sendRequest } = useCustomAxios();

  const handleAuthEmail = async (email, locale) => {
    // 백엔드 요청으로 en으로 시작하는 언어들은 en으로 보냄
    let localeInfo = locale.includes('en') ? 'en' : locale;

    const data = {
      query: userRegistrationCode,
      variables: {
        email: email,
        locale: localeInfo,
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
        'post',
        data,
        options,
        'user_registration_code',
        true
      );

      if (responseData.result === 'ok') {
        return responseData;
      }
    } catch (error) {
      console.log(error);
    }
  };

  return { isLoading, handleAuthEmail };
};
