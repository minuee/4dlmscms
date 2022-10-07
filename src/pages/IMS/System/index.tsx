import React, { lazy } from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';

import {
  IS_IMS_TEST,
  SYSTEM,
  SYSTEM_CREATE,
  SYSTEM_CREATE_INFO,
  SYSTEM_UPDATE,
  SYSTEM_UPDATE_INFO,
  TEST_SYSTEM,
  TEST_SYSTEM_CREATE,
  TEST_SYSTEM_UPDATE,
} from 'sets/constants';

const Detail = lazy(() => import('./Detail'));
const List = lazy(() => import('./ItemList'));

interface IF {}

const System: React.FC<IF> = (props: IF) => {
  const location = useLocation();
  const pathName = location.pathname;
  return (
    <Switch>
      <Route exact path={[SYSTEM, TEST_SYSTEM]}>
        {/* <Route exact path={[SYSTEM, `${SYSTEM}/:venueId`]}> */}
        <List />
      </Route>
      <Route
        path={[
          SYSTEM_CREATE,
          SYSTEM_UPDATE,
          TEST_SYSTEM_CREATE,
          TEST_SYSTEM_UPDATE,
        ]}
      >
        <Detail />
      </Route>
      <Redirect to={pathName.includes(IS_IMS_TEST) ? TEST_SYSTEM : SYSTEM} />
    </Switch>
  );
};
export default System;
