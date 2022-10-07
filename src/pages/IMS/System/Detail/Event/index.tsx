import React, { lazy } from 'react';
import { Route, Switch } from 'react-router-dom';

import {
  SYSTEM_CREATE_EVENT,
  SYSTEM_CREATE_EVENT_CREATE,
  SYSTEM_UPDATE_EVENT,
  SYSTEM_UPDATE_EVENT_CREATE,
  SYSTEM_UPDATE_EVENT_UPDATE
} from 'sets/constants';

const List = lazy(() => import('./ItemList'));
const Detail = lazy(() => import('./Detail'));

interface IF {}

const Event: React.FC<IF> = (props: IF) => {
  return (
    <Switch>
      <Route
        exact
        path={[
          SYSTEM_CREATE_EVENT,
          SYSTEM_UPDATE_EVENT,       
        ]}
      >
        <List />
      </Route>
      <Route
        exact
        path={[
          `${SYSTEM_UPDATE_EVENT}/:nodeId`,
          SYSTEM_CREATE_EVENT_CREATE,
          SYSTEM_UPDATE_EVENT_UPDATE,
          SYSTEM_UPDATE_EVENT_CREATE,          
        ]}
      >
        <Detail />
      </Route>
    </Switch>
  );
};
export default Event;
