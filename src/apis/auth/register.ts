import { createUser } from '@/graphQL/auth';
import { useCustomAxios } from '@/hooks/axios-hooks';

export const useRegisterRequest = () => {
  const { isLoading, sendRequest } = useCustomAxios();

  const handleRegisterRequest = async (values, email) => {
    const data = {
      query: createUser,
      variables: {
        name: values.userName,
        email: email,
        password: values.password,
        language: values.language,
        code: values.authCode,
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
        'create_user',
        false
      );
      // console.log('responseData onSubmit: ', responseData);

      if (responseData.result === 'ok') {
        return responseData.data;
      }
    } catch (error) {
      console.log(error);
    }
  };

  return { isLoading, handleRegisterRequest };
};
