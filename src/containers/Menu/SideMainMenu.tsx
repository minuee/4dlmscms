import React, { useState, useEffect, memo, ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { MENUS_TYPE } from '@/containers/Menu/MenuItems';

interface SideMainMenuProps {
  item: any;
  index: number;
  active: boolean;
  userRole: number;
}
import { returnIcon as getIcon } from '@/utils/commonFn';

const SideMainMenu = ({ item, index, active, userRole }: SideMainMenuProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  let subMenu: any | null = null;
  if (item.sub) subMenu = item.sub;

  useEffect(() => {
    //if (active) setIsOpen(true);
  }, []);

  const toggle = () => setIsOpen((prev) => !prev);

  return item.url ? (
    <li key={`mainmenu_${index}`}>
      {!subMenu ? (
        <Link to={item.url} className={`side-menu ${active ? 'side-menu--active' : ''}`} title={item.name} >
          <div className='side-menu__icon'>{returnIcon(item.name)}</div>
          <div className='side-menu__title'> {item.name} </div>
        </Link>
      ) : (
        // sub item 있을 경우
        <div className={`side-menu side-menu--open ${active ? 'side-menu--active' : ''} ${isOpen ? 'side-menu--open' : ''}`}>
          <div className='side-menu__icon'>{returnIcon(item.name)}</div>
          <div className='side-menu__title'>
            {item.name}
            <div className={`side-menu__sub-icon ${isOpen ? 'transform rotate-180' : ''}`}>
              {getIcon({ icon: 'ChevronDown' })}
            </div>
          </div>
        </div>
      )}

      {subMenu && (
        <ul className='side-menu__sub-open'>
          {subMenu.map((subItem: any, subIndex: number) => {

            if (subItem.role < userRole) return;

            if (subItem.name === 'devider') {
              return (<li key={`devider_${index}`} className='my-3 side-nav__devider'></li>);
            }

            return (
              <li key={`submenu_${index}_${subIndex}`}>
                <Link to={subItem.url} className='side-menu' title={subItem.name}>
                  <div className='side-menu__icon'>
                    {returnIcon(subItem.name)}
                  </div>
                  <div className='side-menu__title'>{subItem.name}</div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  ) : null;
};

export const SideMenuItems = memo(SideMainMenu);

// 메뉴 아이콘 리턴하는 메서드
export const returnIcon = (param: string) => {
  if (param === 'devider') return;
  const ICONS: Record<MENUS_TYPE, ReactElement> = {
    Content: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        className='w-5 h-5'
        viewBox='0 0 20 20'
        fill='currentColor'
      >
        <path d='M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z' />
      </svg>
    ),
    CMS: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        className='w-6 h-6'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9'
        />
      </svg>
    ),
    IMS: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        className='w-5 h-5'
        viewBox='0 0 20 20'
        fill='currentColor'
      >
        <path
          fillRule='evenodd'
          d='M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z'
          clipRule='evenodd'
        />
      </svg>
    ),
    Venue: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        className='w-5 h-5'
        viewBox='0 0 20 20'
        fill='currentColor'
      >
        <path
          fillRule='evenodd'
          d='M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z'
          clipRule='evenodd'
        />
      </svg>
    ),
    Category: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        className='w-5 h-5'
        viewBox='0 0 20 20'
        fill='currentColor'
      >
        <path d='M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z' />
        <path
          stroke='#fff'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M8 11h4m-2-2v4'
        />
      </svg>
    ),
    Users: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        className='w-5 h-5'
        viewBox='0 0 20 20'
        fill='currentColor'
      >
        <path d='M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z' />
      </svg>
    ),
    Event: (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-6 h-6" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )
  };

  return ICONS[param];
};
