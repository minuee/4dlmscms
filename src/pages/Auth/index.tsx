import React from 'react';
import { Link, Redirect, Route, Switch } from 'react-router-dom';

import UseBodyClass from 'comp/Common/UseBodyClass';
import tw from 'tailwind-styled-components';
import {
  AUTH,
  LOGIN,
  AUTH_EMAIL,
  REGISTER,
  FIND_PASSWORD,
  CHANGE_PASSWORD_WITH_CODE,
  CREATE_2FACTOR,
  VERIFY_2FACTOR,
} from 'sets/constants';

import logo from 'imgs/logo/4DLogo.svg';
import imsLogin from 'imgs/login/IMS_Login.svg';

import Login from './Login';
import AuthEmail from './AuthEmail';
import Register from './Register';
import FindPassword from './FindPassword';
import ChangePasswordWithCode from './UpdatePasswordWithCode';

import Create2Factor from './Create2Factor';

const Container = tw.div`
  container
  sm:px-10
`;

const Wrapper = tw.div`
  block
  xl:grid
  grid-cols-2
  gap-4  
`;

export default function Auth() {
  UseBodyClass('login');

  return (
    <Container>
      <Wrapper>
        <div className='flex-col hidden min-h-screen xl:flex'>
          <Link to={LOGIN} className='flex items-center pt-5 -intro-x'>
            <img alt='4DReplay' className='w-20' src={logo} />
          </Link>
          <div className='my-auto'>
            <img
              alt='4DReplay'
              className='w-2/3 -mt-16 -intro-x'
              src={imsLogin}
            />
            <div className='mt-10 text-4xl font-medium leading-tight text-white -intro-x'>
              Any time, any angle,
              <br />
              by one in five seconds.
              <br />
            </div>
            <div className='mt-5 text-xl font-medium leading-tight text-white -intro-x'>
              We will provide an unprecedented viewing experience.
            </div>
          </div>
        </div>
        <div className='flex h-screen py-5 my-10 xl:h-auto xl:py-0 xl:my-0'>
          <Switch>
            <Route exact path={[AUTH, LOGIN]} component={Login} />
            <Route path={AUTH_EMAIL} component={AuthEmail} />
            <Route path={REGISTER} component={Register} />
            <Route path={FIND_PASSWORD} component={FindPassword} />
            <Route path={CHANGE_PASSWORD_WITH_CODE} component={ChangePasswordWithCode} />
            <Route exact path={[CREATE_2FACTOR, VERIFY_2FACTOR]} component={Create2Factor} />
            <Redirect to={AUTH} />
          </Switch>
        </div>
      </Wrapper>
    </Container>
  );
}
