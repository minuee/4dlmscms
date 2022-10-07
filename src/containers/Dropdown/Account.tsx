import React, { useState, useContext } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { User } from '@/redux/Auth/authSlices';
import { Dropdown, DropdownToggle, DropdownMenu } from 'reactstrap';
import { AuthContext } from 'cont/auth';

import { LOGIN, MYPAGE, CHANGE_PASWORD, CHANGE_MY_INFO } from 'sets/constants';
import { returnIcon } from '@/utils/commonFn';

interface AccountProps {}

export const Account: React.FC<AccountProps> = ({}) => {
  const user = useAppSelector((state: ReducerType): User => state.users.authUser);
  const { signout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const history = useHistory();

  function handleLogout() {
    signout(handleGoToLogin);
  }

  function handleGoToLogin() {
    history.push(LOGIN);
  }

  return (
    <Dropdown
      isOpen={isOpen}
      toggle={() => setIsOpen(!isOpen)}
      className='intro-x'
    >
      <DropdownToggle className='cursor-pointer dropdown-toggle' tag='div'>
        {/* <UserIcon className='search__icon text-theme-25' /> */}
        {returnIcon({ icon: 'User', className: 'search__icon text-theme-25' })}
      </DropdownToggle>

      <DropdownMenu right className='w-56 mt-1 dropdown-menu'>
        <div
          className='text-white dropdown-menu__content box animate-dropdownSlide'
          style={{ backgroundColor: '#2b3348' }}
        >
          <div className='p-4 border-b border-dark-3'>
            <div className='font-medium'>{user.email}</div>
            <div className='text-xs mt-0.5 text-gray-600'>{user.role}</div>
          </div>
          <div className='p-2'>
            {/* <Link
              to={MYPAGE}
              className='flex items-center p-2 transition duration-300 ease-in-out rounded-md hover:bg-dark-3'
            >
              {returnIcon({ icon: 'User', className: 'w-4 h-4 mr-2' })}
              My Page
            </Link>
            <Link
              to={CHANGE_MY_INFO}
              className='flex items-center p-2 transition duration-300 ease-in-out rounded-md hover:bg-dark-3'
            >
              {returnIcon({ icon: 'Document', className: 'w-4 h-4 mr-2' })}
              Profile
            </Link> */}
            <Link
              to={CHANGE_PASWORD}
              className='flex items-center p-2 transition duration-300 ease-in-out rounded-md hover:bg-dark-3'
            >
              {returnIcon({ icon: 'Lock', className: 'w-4 h-4 mr-2' })}
              Change Password
            </Link>
          </div>
          <div className='p-2 border-t border-dark-3'>
            <div
              className='flex items-center p-2 transition duration-300 ease-in-out rounded-md cursor-pointer hover:bg-dark-3'
              onClick={handleLogout}
            >
              {returnIcon({
                icon: 'ToggleRight',
                className: 'mr-2 text-red-600',
              })}
              Logout
            </div>
          </div>
        </div>
      </DropdownMenu>
    </Dropdown>
  );
};
