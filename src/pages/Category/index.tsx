import React, { lazy } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { CATEGORY, CATEGORY_CREATE, CATEGORY_UPDATE } from 'sets/constants';

const CategoryList = lazy(() => import('./ItemList'));
const CategoryDetail = lazy(() => import('./Detail'));

interface IF {}

const Dashboard: React.FC<IF> = (props: IF) => {
  return (
    <Switch>
      <Route exact path={CATEGORY}>
        <CategoryList />
      </Route>
      <Route path={[CATEGORY_CREATE, CATEGORY_UPDATE]}>
        <CategoryDetail />
      </Route>
      <Redirect to={CATEGORY} />
    </Switch>
  );
};
export default Dashboard;
