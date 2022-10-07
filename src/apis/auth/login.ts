import { useCustomAxios } from '@/hooks/axios-hooks';

import { user_login } from '@/graphQL/auth';

export const useLoginRequest = () => {
  const { isLoading, sendRequest } = useCustomAxios();

  const handleRequestLogin = async (email, password) => {
    const data = {
      query: user_login,
      variables: {
        email,
        password,
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
        'user_login',
        false
      );

      console.log(responseData);

      if (responseData.result === 'ok') {
        return responseData.data;
      }
    } catch (error) {
      console.log(error);
    }
  };

  return { handleRequestLogin, isLoading };
};
