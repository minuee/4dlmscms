import React from 'react';
import defaultProfileImage from '@/assets/images/user/default-profile.jpg';
export interface UserProps {
  _id?: string;
  name: string;
  email: string;
  state?: number;
  service_in_charge?: string;
  permission?: string;
  role?: string;
  language?: string;
  email_verification?: number;
  phone_verification?: number;
  recent_login?: Date;
  login_count?: number;
  created_at?: Date;

  profileImg?: string;
  group?: 'platform' | 'server' | 'vision';
  company?: string;

  handleClickEvent: (e: React.MouseEvent<HTMLButtonElement>, isOpen: boolean, type: string, email?:string) => void
}

const User = React.memo((props: UserProps) => {
  const editUser = (e: React.MouseEvent<HTMLButtonElement>, type: string) => {
    props.handleClickEvent(e, true, type, props.email);
  };

  return (
    <div className='col-span-12 box md:col-span-6 lg:col-span-3'>
      <div className='flex flex-col items-center p-5 border-b border-gray-200 lg:flex-row dark:border-dark-5'>
        <div className='w-24 h-24 lg:w-12 lg:h-12 image-fit lg:mr-1'>
          <img
            alt='profileImg image'
            className='rounded-full'
            src={props.profileImg ? props.profileImg : defaultProfileImage}
          />
        </div>
        <div className='mt-3 text-center lg:ml-2 lg:mr-auto lg:text-left lg:mt-0'>
          <a href='#' className='font-medium'>
            {props.name}
          </a>
          <div className='text-gray-600 text-xs mt-0.5'>{props.state === 1 ? 'Admin' : 'Operator'}</div>
        </div>
      </div>

      <div className='flex flex-wrap items-center justify-center py-5 lg:flex-nowrap'>
        <button className='px-2 py-1 btn btn-outline-secondary' onClick={(e) => editUser(e, 'R')}>
          Reset PW
        </button>
        <button className='px-2 py-1 ml-1 btn btn-outline-secondary' onClick={(e) => editUser(e, 'U')}>
          Edit
        </button>
        <button className='px-2 py-1 ml-1 btn btn-outline-secondary' onClick={(e) => editUser(e, 'D')}>
          Delete
        </button>
      </div>
    </div>
  );
});

export default User;
