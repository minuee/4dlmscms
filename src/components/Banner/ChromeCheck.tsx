import { returnIcon } from '@/utils/commonFn';
import React, { useState } from 'react';
import ReactTooltip from 'react-tooltip';

interface IF {}

const ChromeCheckBanner: React.FC<IF> = (props: IF) => {
  const isChrome =
    /chrome/.test(navigator.userAgent.toLowerCase()) &&
    !navigator.userAgent.includes('Edg');
  const [isShow, setIsShow] = useState<boolean>(!isChrome);

  const handleHideBanner = () => {
    localStorage.setItem('chromeBanner', 'true');
    setIsShow(false);
  };
  return (
    <>
      <div
        className={
          isShow
            ? 'alert alert-dismissible show box bg-red-500 text-white flex items-center mb-6'
            : 'invisible-and-take-no-space'
        }
        role='alert'
      >
        <span>
          Please use ONLY Chrome(and check whether you are using chrome 64bit)
        </span>
        <button
          type='button'
          className='btn-close'
          data-bs-dismiss='alert'
          aria-label='Close'
          onClick={handleHideBanner}
        >
          {returnIcon({ icon: 'X', dataTip: 'DoNotShowAgain' })}
        </button>
      </div>
      <ReactTooltip />
    </>
  );
};
export default ChromeCheckBanner;
