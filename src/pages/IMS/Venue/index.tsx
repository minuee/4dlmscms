import {
  IS_IMS_TEST,
  TEST_VENUE,
  TEST_VENUE_CREATE,
  TEST_VENUE_UPDATE,
  VENUE,
  VENUE_CREATE,
  VENUE_UPDATE,
} from '@/settings/constants';
import React, { lazy } from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';

const Detail = lazy(() => import('./Detail'));
const ItemList = lazy(() => import('./ItemList'));

interface IF {}

const Venue: React.FC<IF> = (props: IF) => {
  const location = useLocation();
  const pathName = location.pathname;
  return (
    <Switch>
      <Route exact path={[VENUE, TEST_VENUE]}>
        <ItemList />
      </Route>
      <Route
        path={[
          VENUE_CREATE,
          VENUE_UPDATE,
          TEST_VENUE_CREATE,
          TEST_VENUE_UPDATE,
        ]}
      >
        <Detail />
      </Route>
      <Redirect to={pathName.includes(IS_IMS_TEST) ? TEST_VENUE : VENUE} />
    </Switch>
  );
};
export default Venue;
