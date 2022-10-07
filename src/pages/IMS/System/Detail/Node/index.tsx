import React, { lazy } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import {
  SYSTEM_CREATE_NODE,
  SYSTEM_CREATE_NODE_CREATE,
  SYSTEM_UPDATE_NODE,
  SYSTEM_UPDATE_NODE_CREATE,
  SYSTEM_UPDATE_NODE_UPDATE,
  TEST_SYSTEM_CREATE_NODE,
  TEST_SYSTEM_CREATE_NODE_CREATE,
  TEST_SYSTEM_UPDATE_NODE,
  TEST_SYSTEM_UPDATE_NODE_CREATE,
  TEST_SYSTEM_UPDATE_NODE_UPDATE,
} from 'sets/constants';

const List = lazy(() => import('./ItemList'));
const Detail = lazy(() => import('./Detail'));

interface IF {}

const Node: React.FC<IF> = (props: IF) => {
  return (
    <Switch>
      <Route
        exact
        path={[
          SYSTEM_CREATE_NODE,
          SYSTEM_UPDATE_NODE,
          //
          TEST_SYSTEM_CREATE_NODE,
          TEST_SYSTEM_UPDATE_NODE,
        ]}
      >
        <List />
      </Route>
      <Route
        exact
        path={[
          `${SYSTEM_UPDATE_NODE}/:nodeId`,
          SYSTEM_CREATE_NODE_CREATE,
          SYSTEM_UPDATE_NODE_UPDATE,
          SYSTEM_UPDATE_NODE_CREATE,
          //
          `${TEST_SYSTEM_UPDATE_NODE}/:nodeId`,
          TEST_SYSTEM_CREATE_NODE_CREATE,
          TEST_SYSTEM_UPDATE_NODE_CREATE,
          TEST_SYSTEM_UPDATE_NODE_UPDATE,
        ]}
      >
        <Detail />
      </Route>
      {/* <Redirect to={SYSTEM} /> */}
    </Switch>
  );
};
export default Node;
