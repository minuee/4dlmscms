import React, { useState } from 'react';
import { Dropdown, DropdownToggle, DropdownMenu } from 'reactstrap';

import btnQuality from 'imgs/player/icon_quality_normal.svg';
import iconHD from 'imgs/player/icon_HD_badge_large.svg';
import iconCheckmark from 'imgs/player/icon_checkmark_quality.svg';

const BtnResolution = () => {

  const [isShowHD, setIsShowHD] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isShowMenu, setIsShowMenu] = useState(true);
  const [levels, setLevels] = useState();
  const [currentLevel, setCurrentLevel] = useState(0);
  const [currentManualLevel, setCurrentManualLevel] = useState(-1);
  const [currentLevelHeight, setCurrentLevelHeight] = useState('');
  const [displayHeight, setDisplayHeight] = useState('');

  window.videoLevelUpdate = (levels, currentLevel, currentManualLevel, currentLevelHeight) => {
    if(levels && levels.length > 0) {
      const reversedItems = levels.map(item => item).reverse();
      let height = 0;
      
      reversedItems.push({
        height: 'Auto'
      });

      if(currentManualLevel === -1) {
        setDisplayHeight('Auto');
      } else {
        setDisplayHeight(currentLevelHeight);
      } 
      
      if(currentLevelHeight && currentLevelHeight !== '') {
        height = parseInt(currentLevelHeight);
      }      

      setLevels(reversedItems);
      setCurrentLevel(currentLevel);
      setCurrentLevelHeight(currentLevelHeight);

      if(height >= 1080) {
        setIsShowHD(true);
      } else {
        setIsShowHD(false);
      }
    }
  }

  window.showResolutionItems = (isShow) => {
    setIsShowMenu(isShow);
  }

  const onClickChangingLevel = (index) => {
    let selectedLevel = -1;
    if(index === levels.length - 1) {
      selectedLevel = -1;
    } else {
      selectedLevel = levels.length - index - 2;
    }
    window.callByLevel(selectedLevel);
  }

  const openItemList = () => {
    if(isShowMenu) {
      setIsOpen(!isOpen);
    } else {
      setIsOpen(false);
    }    
  }

  return (
    <Dropdown
      direction='up'
      isOpen={isOpen}
      toggle={openItemList}>
      <DropdownToggle className='relative dropdown-toggle cursor-pointer' style={{width: '58px', height: '58px'}} tag='div'>
        <img className="absolute" src={btnQuality} alt="play"/>
        <img className={`absolute left-1/2 bottom-1/2 ${isShowHD ? "" : "hidden"}`} src={iconHD} alt="HD" />              
      </DropdownToggle>

      <DropdownMenu right className='dropdown-menu mb-1'>
        <div className='dropdown-menu__content box text-white animate-dropdownSlide rounded'>
          <div className='py-2'>
            <div className='font-medium px-5 text-sm'>Quality</div>
          </div>
          <div> 
            {
              levels && 
              levels.map((level, index) => {
                return (
                  <div key={`level-${index}`} className='item cursor-pointer flex px-3 items-center justify-between' onClick={() => onClickChangingLevel(index)}>
                    <div className={`${level.height === currentLevelHeight? "text-xs font-bold text-red-500": "text-xs"}`}>{level.height}</div>
                    <img src={iconCheckmark} className={`${level.height === displayHeight? "visible": "invisible"}`} alt="mark" />
                  </div>
                );
              })
            }
          </div>
        </div>
      </DropdownMenu>
    </Dropdown>
  );
};

export default BtnResolution;