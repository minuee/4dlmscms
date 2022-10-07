import {
  CATEGORY,
  CMS_CONTENT,
  USERS,
  VENUE,
  EVENT
} from '@/settings/constants';

export type MENUS_TYPE =
  | 'CMS'
  | 'Content'
  | 'IMS'
  | 'Venue'
  | 'Category'
  | 'Users'
  | 'Event';

export const MenuItems = [
  // {
  //   name: 'Dashboard',
  //   title: 'Dashboard',
  //   url: DASHBOARD,
  //   role: 2
  // },
  {
    name: 'CMS',
    title: 'CMS',
    url: CMS_CONTENT,
    role: 2,
    sub: [
      {
        name: 'Content',
        title: 'CMS List',
        url: CMS_CONTENT,
        role: 2
      },
      {
        name: 'Category',
        title: 'Category',
        url: CATEGORY,
        role: 1
      },
      {
        name: 'Users',
        title: 'Users List',
        url: USERS,
        role: 1
      },
    ],
  },
  process.env.REACT_APP_SHOW_IMS === 'true' && {
    name: 'IMS',
    title: 'IMS',
    url: VENUE,
    role: 1,
    sub: [
      {
        name: 'Venue',
        title: 'Venue List',
        url: VENUE,
        role: 1
      },      
    ],
  },  
];