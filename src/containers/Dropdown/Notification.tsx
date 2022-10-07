import { returnIcon } from '@/utils/commonFn';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown, DropdownToggle, DropdownMenu } from 'reactstrap';

interface NotificationProps {}

export const Notification: React.FC<NotificationProps> = ({}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dropdown
      isOpen={isOpen}
      toggle={() => setIsOpen(!isOpen)}
      className='intro-x mr-4 sm:mr-6'
    >
      <DropdownToggle
        className='dropdown-toggle notification notification--bullet cursor-pointer'
        tag='div'
      >
        {returnIcon({
          icon: 'Bell',
          className: 'text-theme-25',
        })}
      </DropdownToggle>

      <DropdownMenu right className='dropdown-menu notification-content pt-2'>
        <div
          className='notification-content__box dropdown-menu__content box animate-dropdownSlide'
          style={{ backgroundColor: '#2b3348' }}
        >
          <div className='notification-content__title'>Notifications</div>

          <div className='cursor-pointer relative flex items-center '>
            <div className='w-12 h-12 flex-none image-fit mr-1'>
              <div className='w-3 h-3 bg-theme-10 absolute right-0 bottom-0 rounded-full border-2 border-white'></div>
            </div>
            <div className='ml-2 overflow-hidden'>
              <div className='flex items-center'>
                <Link to={'#'} className='font-medium truncate mr-5'>
                  Robert De Niro
                </Link>
                <div className='text-xs text-gray-500 ml-auto whitespace-nowrap'>
                  01:10 PM
                </div>
              </div>
              <div className='w-full truncate text-gray-600 mt-0.5'>
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry. Lorem Ipsum has been the industry&#039;s standard
                dummy text ever since the 1500
              </div>
            </div>
          </div>

          <div className='cursor-pointer relative flex items-center mt-5'>
            <div className='w-12 h-12 flex-none image-fit mr-1'>
              <div className='w-3 h-3 bg-theme-10 absolute right-0 bottom-0 rounded-full border-2 border-white'></div>
            </div>
            <div className='ml-2 overflow-hidden'>
              <div className='flex items-center'>
                <Link to={'#'} className='font-medium truncate mr-5'>
                  Al Pacino
                </Link>
                <div className='text-xs text-gray-500 ml-auto whitespace-nowrap'>
                  05:09 AM
                </div>
              </div>
              <div className='w-full truncate text-gray-600 mt-0.5'>
                There are many variations of passages of Lorem Ipsum available,
                but the majority have suffered alteration in some form, by
                injected humour, or randomi
              </div>
            </div>
          </div>
        </div>
      </DropdownMenu>
    </Dropdown>
  );
};
