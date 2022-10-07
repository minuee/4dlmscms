import {  
  EVENT,
  EVENT_UPDATE,
} from '@/settings/constants';
import React, { lazy } from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';

//const Detail = lazy(() => import('./Detail'));
const ItemList = lazy(() => import('./ItemList'));

interface IF {}

const Event: React.FC<IF> = (props: IF) => {
  const location = useLocation();
  const pathName = location.pathname;
  return (
    <Switch>
      <Route exact path={[EVENT]}>
        <ItemList />
      </Route>
      {/* <Route
        path={[          
          EVENT_UPDATE,        
        ]}
      >
        <Detail />
      </Route> */}
    </Switch>
  );
};
export default Event;
