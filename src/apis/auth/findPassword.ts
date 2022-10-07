import { showNotification } from '@/utils/commonFn';
import { useTranslation } from 'react-i18next';

import { user_password_code } from '@/graphQL/auth';
import { useCustomAxios } from '@/hooks/axios-hooks';

export const useFindPasswordRequest = () => {
  const { isLoading, sendRequest } = useCustomAxios();
  const { t } = useTranslation();

  ///////
  const handleRequestFindPassword = async (values, locale) => {
    const data = {
      query: user_password_code,
      variables: {
        email: values.email,
        locale,
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
        'user_password_code',
        true
      );

      if (responseData.result === 'ok') {
        const message = t('auth:checkEmailAuthCode');
        showNotification(message, 'info');
        return responseData;
      }
    } catch (error) {
      console.log(error);
    }
  };

  return { isLoading, handleRequestFindPassword };
};
