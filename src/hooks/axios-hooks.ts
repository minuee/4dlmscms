import React, { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '@/helpers/axiosInstance';
import { showNotification, parseResponseData } from '@/utils/commonFn';

import { useAppSelector } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { User } from '@/redux/Auth/authSlices';

import { useTranslation } from 'react-i18next';

type HeaderType = {
  headers?: {
    'Content-Type'?: string;
    Authorization?: string;
  };
};

export const useCustomAxios = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const user = useAppSelector(
    (state: ReducerType): User => state.users.authUser
  );
  const { t, i18n } = useTranslation();

  const options = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: user.token,
    },
  };

  const sendRequest = async (
    url: string = '/gql/user',
    // url: string = '/ims/v0/meta/ql',
    method: 'post' | 'get' = 'post',
    data: any,
    headers: HeaderType = options,
    mutationName: string | string[],
    noSuccessAlert: boolean
  ): Promise<any> => {
    const baseURL = process.env.REACT_APP_CMS_GRAPHQL_API;

    setIsLoading(true);
    try {
      const checkResponseError = (data) => {
        if (data) {
          if (data.result === 'ok') {
            if (!noSuccessAlert) showNotification(data.message, 'success');
            // console.log(data);
            // return data.data; //! 이렇게 하려면 기존 데이터들 다 바꿔야 한다.................... 차분히 다 바꾸기
          } else {
            showNotification(data.message, 'error');
          }
        } else {
          showNotification(t('unKnownError'), 'error');
          setError('unKnownError');
        }
        // return null;
      };

      const response = await axiosInstance()
        .post(baseURL + url, data, headers)
        //.post(url, data, headers)
        .then((res) => {
          setIsLoading(false);
          if (res && res.status === 200) {
            let data;
            if (typeof mutationName === 'string') {
              data = parseResponseData(res, mutationName);
              checkResponseError(data);

              // 여러 쿼리를 날릴 경우
            } else {
              data = [];
              mutationName.map((name) => {
                const parsedData = parseResponseData(res, name);
                data.push({ [name]: parsedData });
              });

              data.map((d) => {
                const key = Object.keys(d)[0];
                checkResponseError(d[key]);
              });
            }

            setIsLoading(false);
            return data;
          } else {
            showNotification(t('unKnownError'), 'error');
          }
          return res;
        })
        .catch((err) => {
          setIsLoading(false);
          showNotification(err.message, 'error');
          setError(err.message);
        });

      return response;
    } catch (err) {
      setIsLoading(false);
      showNotification(err.message, 'error');
      setError(err.message);
    }
  };
  const clearError = () => {
    setError(null);
  };

  return { isLoading, error, sendRequest, clearError };
};
