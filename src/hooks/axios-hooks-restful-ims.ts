import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

// import axiosInstance from '@/helpers/axiosInstance';
import { showNotification, parseResponseData } from '@/utils/commonFn';

import { useAppSelector } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { User } from '@/redux/Auth/authSlices';

import { useTranslation } from 'react-i18next';

type HeaderType = {
  'Content-Type'?: string;
  authorization?: string;
};

export const useRestfulCustomAxios = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const user = useAppSelector(
    (state: ReducerType): User => state.users.authUser
  );

  const restfulHeader = {
    'Content-Type': 'application/json',
    authorization: user.token,
  };

  const sendRequest = async (
    url: string,
    requestType: 'graphQL' | 'restful', // 없애기
    method: 'post' | 'get' | 'put' | 'patch' | 'delete' = 'post',
    headers: HeaderType = restfulHeader,
    data?: any,
    noSuccessAlert?: boolean,
    test?: boolean
  ): Promise<any> => {
    const baseURL = test
      ? process.env.REACT_APP_IMS_RESTFUL_API_TEST
      : process.env.REACT_APP_IMS_RESTFUL_API;

    setIsLoading(true);

    const config = {
      method,
      url: baseURL + url,
      data,
      headers,
    };

    const responseData = await axios(config).catch((err) => {
      setIsLoading(false);
      showNotification(err.message, 'error');
      setError(err.message);

      return null;
    });

    // // 204일 경우 에러 처리하기
    // if (responseData.status === 204) {
    //   setIsLoading(false);
    //   showNotification('Not authorized', 'error');
    //   setError('Not authorized');

    //   return null;
    // }
    // console.log({ responseData });

    if (!responseData) return null;
    if (responseData.data?.result?.toLowerCase() !== 'ok') {
      setIsLoading(false);
      if (responseData.data?.message) {
        showNotification(responseData.data?.message, 'error');
        setError(responseData.data?.message);
      } else {
        showNotification('Something went wrong', 'error');
        setError('unknown error');
      }
    }

    setIsLoading(false);
    if (noSuccessAlert === false)
      showNotification(responseData.data.message, 'success');

    return responseData.data.data;
  };

  const clearError = () => setError(null);

  return { isLoading, error, sendRequest, clearError };
};
