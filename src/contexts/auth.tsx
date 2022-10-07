import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { addUser, delUser, User } from '@/redux/Auth/authSlices';
import { LOGIN } from 'sets/constants';
// import { ToastContainer } from "react-toastify";
import { showNotification } from '@/utils/commonFn';

// let mounted: boolean = false;

type AuthProps = {
  isAuthenticated: boolean;
  authenticate: Function;
  signout: Function;
};

export const AuthContext = createContext({} as AuthProps);

let logoutTimer;

const AuthProvider = (props: any) => {
  const history = useHistory();
  const { t } = useTranslation();

  const handleGoToLogin = () => history.push(LOGIN);

  const user = useAppSelector((state: ReducerType): User => state.users.authUser);

  const isValidToken = () => {
    const user = useAppSelector((state: ReducerType): User => state.users.authUser);
    if (user && user.token) {
      return true;
    }
    return false;
  };

  const [isAuthenticated, setAuthenticated] = useState(isValidToken());
  const dispatch = useAppDispatch();

  // Timer
  useEffect(() => {
    // return;
    if (user.token && user.tokenExpirationDate) {
      const expiry = new Date(user.tokenExpirationDate).getTime();
      const remainingTime = expiry - new Date().getTime();

      // settimeout은  32 bit int만 수용할 수 있으므로 이 이상의 수를 넣으면 에러가 나서 즉시 로그아웃이 실행 됨
      if (remainingTime > 2147483647) return;

      logoutTimer = setTimeout(signoutOutofToken, remainingTime);
    } else {
      clearTimeout(logoutTimer);
    }
  });

  useEffect(() => {
    return () => { clearTimeout(logoutTimer); };
  }, []);

  function authenticate(userInfo, callback: Function) {
    dispatch(addUser(userInfo));
    setAuthenticated(true);
    setTimeout(callback, 100);
  }

  function signout(callback: Function) {
    dispatch(delUser());
    setAuthenticated(false);
    setTimeout(callback, 100);
  }

  const signoutOutofToken = useCallback(() => {
    showNotification(t('auth:tokenExpired'), 'info');
    signout(handleGoToLogin);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, authenticate, signout }}>
      {props.children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
