import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { MenuItems } from '@/containers/Menu/MenuItems';
import { SideMenuItems } from '@/containers/Menu/SideMainMenu';

import { useAppSelector } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { User } from '@/redux/Auth/authSlices';

interface SideMenuProps {}

const SideMenu = (props: SideMenuProps) => {
  const history = useHistory();
  const location = history.location;

  const user = useAppSelector(
    (state: ReducerType): User => state.users.authUser
  );

  const [openUserMenu, setOpenUserMenu] = useState(false);

  const onToggleOpenMenu = () => setOpenUserMenu(!openUserMenu);

  return (
    <nav className='side-nav'>
      <h1 className='sr-only'>side navigation</h1>
      <ul>
        {MenuItems &&
          MenuItems.map((item: any, index: number) => {
            if (item.role < user.state) return;
            if (item.name !== 'devider') {
              return (
                <SideMenuItems
                  key={`sidemenu_${index}`}
                  item={item}
                  index={index}
                  active={item.url === location.pathname ? true : false}
                  userRole={user.state}
                />
              );
            } else {
              return (
                <li
                  key={`devider_${index}`}
                  className='side-nav__devider my-6'
                ></li>
              );
            }
          })}
      </ul>
    </nav>
  );
};

export default SideMenu;
