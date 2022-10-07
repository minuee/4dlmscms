import React, { useState, useContext } from 'react';
import { useHistory } from 'react-router-dom';

import axios from 'axios';

import { showNotification, getFutureDate } from '@/utils/commonFn';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { User, addUser } from '@/redux/Auth/authSlices';
import { AuthContext } from 'cont/auth';
import { LOGIN } from 'sets/constants';
import { TOKEN_EXPIRE } from '@/settings/constants';

import { useTranslation } from 'react-i18next';

type HeaderType = {
  'Content-Type'?: string;
  authorization?: string;
};

export const useRestfulCustomAxios = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { signout } = useContext(AuthContext);
  const user = useAppSelector((state: ReducerType): User => state.users.authUser);  
  const dispatch = useAppDispatch();
  const history = useHistory();

  function handleLogout() {
    signout(handleGoToLogin);
  }

  function handleGoToLogin() {
    history.push(LOGIN);
  }

  const restfulHeader = {
    'Content-Type': 'application/json',
    authorization: user.token,
  };

  const sendRequest = async (
    url: string,
    requestType,
    method: 'post' | 'get' | 'put' | 'patch' | 'delete' = 'post',
    headers: HeaderType = restfulHeader,
    data?: any,
    noSuccessAlert?: boolean,
    ims?: boolean
  ): Promise<any> => {
    const baseURL = ims
      ? process.env.REACT_APP_IMS_RESTFUL_API
      : process.env.REACT_APP_CMS_RESTFUL_API;

    setIsLoading(true);

    const config = { method, url: baseURL + url, data, headers };

    const responseData = await axios(config)
      .then((responseData) => {
        setIsLoading(false);
        if (!responseData || responseData.data?.result?.toLowerCase() !== 'ok') {
          showNotification(responseData.data?.message ?? 'Something went wrong', 'error');
          setError(responseData.data?.message ?? 'unknown error');
          return null;
        }
        // 성공 시
        if (noSuccessAlert === false) {
          showNotification(responseData.data.message, 'success');
        }

        if(responseData?.data?.token) {
          const expiry = getFutureDate(TOKEN_EXPIRE);
          const updateUser = {
            ...user, 
            token: responseData?.data?.token,
            tokenExpirationDate: expiry
          };
          dispatch(addUser(updateUser));
        }

        return responseData.data.data;
      })
      .catch((err) => {
        setIsLoading(false);
        setError(err.message);

        showNotification(err.message, 'error');              

        if(err.response?.status === 401) {
          handleLogout();
        }
        return null;
      })
      // .finally(() => {
      //   setIsLoading(false);
      // });

    return responseData;
  };

  const clearError = () => setError(null);

  return { isLoading, error, sendRequest, clearError };
};
