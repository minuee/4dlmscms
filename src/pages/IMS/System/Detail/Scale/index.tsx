import React, { lazy } from 'react';
import { Route, Switch } from 'react-router-dom';

import {
  SYSTEM_CREATE_SCALE,
  SYSTEM_CREATE_SCALE_CREATE,
  SYSTEM_UPDATE_SCALE,
  TEST_SYSTEM_CREATE_SCALE,
  TEST_SYSTEM_CREATE_SCALE_CREATE,
  TEST_SYSTEM_UPDATE_SCALE,
} from 'sets/constants';

const List = lazy(() => import('./ItemList'));
const Detail = lazy(() => import('./Detail'));

function Scale() {
  return (
    <Switch>
      <Route
        exact
        path={[
          SYSTEM_CREATE_SCALE,
          SYSTEM_UPDATE_SCALE,
          //
          TEST_SYSTEM_CREATE_SCALE,
          TEST_SYSTEM_UPDATE_SCALE,
        ]}
      >
        <List />
      </Route>
      <Route
        exact
        path={[
          `${SYSTEM_CREATE_SCALE_CREATE}`,
          `${SYSTEM_UPDATE_SCALE}/:scaleId`,
          //
          `${TEST_SYSTEM_CREATE_SCALE_CREATE}`,
          `${TEST_SYSTEM_UPDATE_SCALE}/:scaleId`,
        ]}
      >
        <Detail />
      </Route>
    </Switch>
  );
};
export default Scale;
