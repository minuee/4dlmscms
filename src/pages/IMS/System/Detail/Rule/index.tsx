import React, { lazy } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import {
  SYSTEM,
  SYSTEM_CREATE,
  SYSTEM_CREATE_RULE,
  SYSTEM_CREATE_RULE_CREATE,
  SYSTEM_UPDATE,
  SYSTEM_UPDATE_RULE,
  TEST_SYSTEM_CREATE_RULE,
  TEST_SYSTEM_CREATE_RULE_CREATE,
  TEST_SYSTEM_UPDATE_RULE,
} from 'sets/constants';

const List = lazy(() => import('./ItemList'));
const Detail = lazy(() => import('./Detail'));

interface IF {}

const Rule: React.FC<IF> = (props: IF) => {
  {
    /* list 에서 아이템 클릭하면 detail로 이동  */
  }
  return (
    <Switch>
      <Route
        exact
        path={[
          SYSTEM_CREATE_RULE,
          SYSTEM_UPDATE_RULE,
          //
          TEST_SYSTEM_CREATE_RULE,
          TEST_SYSTEM_UPDATE_RULE,
        ]}
      >
        <List />
      </Route>
      <Route
        exact
        path={[
          `${SYSTEM_CREATE_RULE_CREATE}`,
          `${SYSTEM_UPDATE_RULE}/:ruleId`, //
          `${TEST_SYSTEM_CREATE_RULE_CREATE}`,
          `${TEST_SYSTEM_UPDATE_RULE}/:ruleId`,
        ]}
      >
        <Detail />
      </Route>
      {/* <Redirect to={SYSTEM} /> */}
    </Switch>
  );
};
export default Rule;
