import React, { lazy } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import {
  SYSTEM_CREATE_GROUP,
  SYSTEM_CREATE_GROUP_CREATE,
  SYSTEM_UPDATE_GROUP,
  SYSTEM_CREATE,
  SYSTEM_UPDATE,
  TEST_SYSTEM_UPDATE,
  TEST_SYSTEM_CREATE_GROUP,
  TEST_SYSTEM_CREATE_GROUP_CREATE,
  TEST_SYSTEM_UPDATE_GROUP,
} from '@/settings/constants';

interface IF {}

const List = lazy(() => import('./ItemList'));
const Detail = lazy(() => import('./Detail'));

const Group: React.FC<IF> = (props: IF) => {
  return (
    <Switch>
      {/* <Route exact path={[`${SYSTEM_UPDATE}/:venueId`, SYSTEM_CREATE_GROUP]}> */}
      <Route
        exact
        path={[
          SYSTEM_UPDATE,
          SYSTEM_CREATE_GROUP,
          SYSTEM_UPDATE_GROUP,
          //
          TEST_SYSTEM_UPDATE,
          TEST_SYSTEM_CREATE_GROUP,
          TEST_SYSTEM_UPDATE_GROUP,
        ]}
      >
        {/* <Route exact path={[SYSTEM_CREATE, SYSTEM_UPDATE]}> */}
        {/* <Route exact path={[SYSTEM_CREATE_GROUP, SYSTEM_UPDATE_GROUP]}> */}
        <List />
      </Route>
      {/* <Route
        exact
        path={[
          `${SYSTEM_CREATE_GROUP_CREATE}`,
          `${SYSTEM_UPDATE_GROUP}/:nodeId`, //
          `${TEST_SYSTEM_CREATE_GROUP_CREATE}`,
          `${TEST_SYSTEM_UPDATE_GROUP}/:nodeId`,
        ]}
      >
        <Detail />
      </Route> */}
      {/* <Redirect to={SYSTEM} /> */}
    </Switch>
  );
};
export default Group;
