import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { VelocityTransitionGroup } from 'velocity-react';
import { CMS_CONTENT } from 'sets/constants';

import { MenuItems } from '@/containers/Menu/MenuItems';

import logo from 'imgs/logo/4DLogo.svg';
import { returnIcon } from '@/utils/commonFn';

import { useAppSelector } from '@/redux/hooks';
import { ReducerType } from '@/redux/reducer';
import { User } from '@/redux/Auth/authSlices';

const MobileMenuItem = ({ content }) => {
  const user = useAppSelector(
    (state: ReducerType): User => state.users.authUser
  );

  if (content.name === 'devider')
    return <li className='relative z-10 h-px w-full bg-dark-3'></li>;

  return (
    <li className='menu menu--active'>
      <Link to={content.url} className='menu menu--active'>
        <div className='menu__icon'>{/* {returnIcon(content.name)} */}</div>
        <span className='menu__title capitalize'>{content.name}</span>
      </Link>

      {/* 하위메뉴 */}
      {content.sub && (
        <ul>
          {content.sub.map((subItem: any, subIndex: number) => {
            if (subItem.role < user.state) return;
            return (
              <li key={`submenu_${content.name}_${subIndex}`}>
                <Link
                  to={subItem.url}
                  className='side-menu'
                  title={subItem.name}
                >
                  <div className='side-menu__title'>{subItem.name}</div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
};

interface MobileMenuProps {}

const MobileMenu: React.FC<MobileMenuProps> = ({}) => {
  const [openMenu, setOpenMenu] = useState<boolean>(false);

  function onToggleOpenMenu() {
    setOpenMenu(!openMenu);
  }

  return (
    <div className='mobile-menu md:hidden'>
      <div className='mobile-menu-bar'>
        <Link to={CMS_CONTENT} className='mr-auto flex'>
          <img alt='4DReplay-Logo' className='w-16' src={logo} />
        </Link>
        <div id='mobile-menu-toggler' onClick={onToggleOpenMenu}>
          {returnIcon({
            icon: 'BarChart',
            className: 'w-8 h-8 text-white transform -rotate-90',
          })}
        </div>
      </div>
      <VelocityTransitionGroup
        enter={{ animation: 'slideDown' }}
        leave={{ animation: 'slideUp' }}
      >
        {openMenu && (
          <nav className='hidden border-t border-theme-2 py-5'>
            <ul className='menu__sub-open'>
              <h1 className='sr-only'>mobile navigation</h1>
              {MenuItems.map((item, index) => {
                return (
                  <MobileMenuItem key={`${item.name}${index}`} content={item} />
                );
              })}
            </ul>
          </nav>
        )}
      </VelocityTransitionGroup>
    </div>
  );
};

export default MobileMenu;
