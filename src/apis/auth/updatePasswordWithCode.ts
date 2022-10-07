import { user_password_update_with_code } from '@/graphQL/auth';
import { useCustomAxios } from '@/hooks/axios-hooks';

export const useUpdatePasswordWithCodeRequest = () => {
  const { isLoading, sendRequest } = useCustomAxios();

  const handleUpdatePasswordRequest = async (values) => {
    const data = {
      query: user_password_update_with_code,
      variables: {
        email: values.email,
        code: values.authCode,
        next_password: values.newPassword,
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
        'user_password_update_with_code',
        false
      );

      if (responseData.result === 'ok') {
        return responseData;
      }
    } catch (error) {
      console.log(error);
    }
  };

  return { isLoading, handleUpdatePasswordRequest };
};
