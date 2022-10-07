import { addNewUser, updateUser, deleteUser, user_password_reset } from '@/graphQL/users';
import { useCustomAxios } from '@/hooks/axios-hooks';

export const useUserMgtRequest = () => {
  const { isLoading, sendRequest } = useCustomAxios();

  const handleAddNewUserRequest = async (userName, email, password, language) => {
    const data = {
      query: addNewUser,
      variables: {
        name: userName,
        email: email,
        password: password,
        language: language
      },
    };

    try {
      const responseData = await sendRequest(
        undefined,
        'post',
        data,
        undefined,
        'add_user',
        false
      );        

      if (responseData.result === 'ok') {
        return responseData.token;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleUpdateUserRequest = async (userName, email, state) => {
    const data = {
      query: updateUser,
      variables: {
        name: userName,
        email: email,
        state: state        
      },
    };

    try {
      const responseData = await sendRequest(
        undefined,
        'post',
        data,
        undefined,
        'user_info_update',
        false
      );      

      if (responseData.result === 'ok') {
        return responseData.token;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleResetPasswordRequest = async (email, password) => {
    const data = {
      query: user_password_reset,
      variables: {
        email: email,
        password: password
      },
    };

    try {
      const responseData = await sendRequest(
        undefined,
        'post',
        data,
        undefined,
        'user_password_reset',
        false
      );      

      if (responseData.result === 'ok') {
        return responseData.token;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeleteUserRequest = async (email) => {
    const data = {
      query: deleteUser,
      variables: {
        email: email
      },
    };

    try {
      const responseData = await sendRequest(
        undefined,
        'post',
        data,
        undefined,
        'user_delete',
        false
      );      

      if (responseData.result === 'ok') {
        return responseData.token;
      } else {
        return null;
      }
    } catch (error) {
      console.log(error);
    }
  };

  return { 
    isLoading, 
    handleAddNewUserRequest, 
    handleUpdateUserRequest,
    handleDeleteUserRequest,
    handleResetPasswordRequest
  };
};
