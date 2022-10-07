import React from 'react';
import { Link } from 'react-router-dom';
import { Language } from '../Dropdown/Language';
import { Account } from '../Dropdown/Account';
import { Breadcrumb } from '@/components/Breadcrumb/Breadcrumb';

import { CMS_CONTENT } from 'sets/constants';

import logo from 'imgs/logo/4DLogo.svg';

const Topbar = () => {
  return (
    <div className='px-3 mb-12 -mx-3 border-b top-bar-boxed border-theme-2 -mt-7 md:-mt-5 sm:-mx-8 sm:px-8 md:pt-0'>
      <div className='flex items-center h-full'>
        <Link to={CMS_CONTENT} className='hidden -intro-x md:flex'>
          <img alt='4DReplay' className='w-20' src={logo} />
        </Link>
        <Breadcrumb />
        <Language />
        <Account />
      </div>
    </div>
  );
};

export default Topbar;
