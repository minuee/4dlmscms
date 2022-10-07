import React, { useState } from 'react';
import Routes from './Routes';
//import { signIn, signinType } from './test';

interface Props {}

export const App: React.FC<Props> = () => {  
  // const [user, setUser] = useState(null);

  // const login = (reqData: signinType) => {
  //   setUser(signIn(reqData));
  // }
  return <Routes />;
};
