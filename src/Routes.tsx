import React, { useContext, lazy, Suspense } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import AuthProvider, { AuthContext } from 'cont/auth';
import { PageLoader } from 'comp/PageLoader/PageLoader';

import {
  AUTH,
  MYPAGE,
  USERS,
  CMS,
  CATEGORY,
  VENUE,
  SYSTEM,
  TEST_SYSTEM,
  TEST_VENUE,  
} from './settings/constants';

// CMS
const BaseLayout = lazy(() => import('@/containers/Layout/BaseLayout'));
const Cms = lazy(() => import('./pages/CMS'));
const Category = lazy(() => import('./pages/Category'));
// IMS
const Venue = lazy(() => import('./pages/IMS/Venue'));
const System = lazy(() => import('./pages/IMS/System'));
const ChromeCheckBanner = lazy(() => import('comp/Banner/ChromeCheck'));

const Auth = lazy(() => import('./pages/Auth'));
const Mypage = lazy(() => import('./pages/Mypage'));
const UserList = lazy(() => import('./pages/Users/index'));

const AuthRoute = ({ children, ...rest }) => {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <Route {...rest}
      render={({ location }) =>
        isAuthenticated ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: AUTH,
              state: { from: location },
            }}
          />
        )
      }
    />
  );
};

const Routes = () => {
  const hideChromeBanner = localStorage.getItem('chromeBanner');

  return (
    <>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          {hideChromeBanner !== 'true' && <ChromeCheckBanner />}
          <Switch>
            {/* CMS */}
            <AuthRoute path={CMS}>
              <BaseLayout>
                <Suspense fallback={<PageLoader />}>
                  <Cms />
                </Suspense>
              </BaseLayout>
            </AuthRoute>

            <AuthRoute path={CATEGORY}>
              <BaseLayout>
                <Suspense fallback={<PageLoader />}>
                  <Category />
                </Suspense>
              </BaseLayout>
            </AuthRoute>

            <AuthRoute path={MYPAGE}>
              <BaseLayout>
                <Suspense fallback={<PageLoader />}>
                  <Mypage />
                </Suspense>
              </BaseLayout>
            </AuthRoute>

            <AuthRoute path={USERS}>
              <BaseLayout>
                <Suspense fallback={<PageLoader />}>
                  <UserList />
                </Suspense>
              </BaseLayout>
            </AuthRoute>

            {/*  */}
            {/* IMS TEST */}
            {/*  */}
            <AuthRoute path={[VENUE, TEST_VENUE]}>
              <BaseLayout>
                <Suspense fallback={<PageLoader />}>
                  <Venue />
                </Suspense>
              </BaseLayout>
            </AuthRoute>

            <AuthRoute path={[SYSTEM, TEST_SYSTEM]}>
              <BaseLayout>
                <Suspense fallback={<PageLoader />}>
                  <System />
                </Suspense>
              </BaseLayout>
            </AuthRoute>

            <Route path={AUTH}>
              <Auth />
            </Route>
            <Redirect to={AUTH} />
          </Switch>
        </Suspense>
      </AuthProvider>
      <ToastContainer />
    </>
  );
};

export default Routes;
