import React, { useState } from 'react';
import axios from 'axios';

import { showNotification } from '@/utils/commonFn';

import { useAppSelector } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { User } from '@/redux/Auth/authSlices';

import { useTranslation } from 'react-i18next';

type HeaderType = {
  'Content-Type'?: string;
  authorization?: string;
};

type Props = {
  url: string;
  method?: 'post' | 'get' | 'put' | 'patch' | 'delete';
  headers?: HeaderType;
  data?: any;
  noSuccessAlert?: boolean;
  param?: any;
  onUploadProgress?: any;
};

export const useVideoImagesAxios = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const user = useAppSelector((state: ReducerType): User => state.users.authUser);

  const restfulHeader = {
    'Content-Type': 'application/json',
    authorization: user.token,
  };

  const sendRequest = async (props: Props) => {
    const {
      url,
      method = 'post',
      headers = restfulHeader,
      data,
      noSuccessAlert,
      param,
      onUploadProgress,
    } = props;
    const baseURL = process.env.REACT_APP_CMS_RESTFUL_API;

    setIsLoading(true);

    const config = {
      method,
      url: baseURL + url,
      data,
      headers,
      onUploadProgress,
    };

    const responseData = await axios(config)
      .then((responseData) => {
        if (!responseData || responseData.data?.result?.toLowerCase() !== 'ok') {
          showNotification(responseData.data?.message ?? 'Something went wrong', 'error');
          setError(responseData.data?.message ?? 'unknown error');
          return null;
        }

        if (noSuccessAlert === false) {
          showNotification(responseData.data.message, 'success');
        }

        const result = { ...responseData.data, param };
        return result;
      })
      .catch((err) => {
        showNotification(err.message, 'error');
        setError(err.message);
        return null;
      })
      .finally(() => {
        setIsLoading(false);
      });

    return responseData;    
  };

  const clearError = () => setError(null);

  return { isLoading, error, sendRequest, clearError };
};
