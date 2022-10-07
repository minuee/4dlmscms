import React from 'react';
import DropDownHover, { DropdownList } from './DropdownHover';
// import { faPlus, faCog, faEllipsisV } from '@fortawesome/free-solid-svg-icons'
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

interface IF {}

const MypageDropDown: React.FC<IF> = (props: IF) => {
  return (
    // <DropDownHover label={<FontAwesomeIcon icon={faEllipsisV} />} align='right'>
    <DropDownHover label={<p>test</p>} align='right'>
      <DropdownList>
        <a href='/' className='flex items-center'>
          {/* <FontAwesomeIcon icon={faPlus} /> */}
          <span className='ml-3'>Add Category</span>
        </a>
      </DropdownList>

      <DropdownList>
        <a href='/' className='flex items-center'>
          {/* <FontAwesomeIcon icon={faCog} /> */}
          <span className='ml-3'>Settings</span>
        </a>
      </DropdownList>
    </DropDownHover>
  );
};
export default MypageDropDown;
