import React, { useContext } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { AuthContext } from 'cont/auth';

import { MYPAGE, CHANGE_PASWORD, CHANGE_MY_INFO, LOGIN } from 'sets/constants';

import ChangeMyInfo from './updateProfile';
import ChangePassword from './updatePassword';
import Mypage from './mypage';
import Test from './test';

interface IndexProps {}

const Events: React.FC<IndexProps> = (props: IndexProps) => {
  const { authenticate, isAuthenticated } = useContext(AuthContext);
  if (!isAuthenticated) return <Redirect to={{ pathname: LOGIN }} />;

  return (
    <Switch>
      <Route exact path={MYPAGE}>
        <Mypage />
      </Route>
      <Route exact path={CHANGE_MY_INFO}>
        <ChangeMyInfo />
      </Route>
      <Route exact path={CHANGE_PASWORD}>
        <ChangePassword />
      </Route>

      {/* test */}
      <Route exact path='/mypage/test'>
        <Test />
      </Route>
      <Redirect to={MYPAGE} />
    </Switch>
  );
};

export default Events;
