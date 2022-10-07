import React, { useState } from 'react';

export const useAccordion = () => {
  const [isShowAccordion, setisShowAccordion] = useState<boolean>(true);
  const handleToggleAccordionView = () => setisShowAccordion((prev) => !prev);

  const returnUpDownIcon = (up: boolean) => {
    let svg;
    if (up) {
      svg = (
        <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
          <path
            fillRule='evenodd'
            d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z'
            clipRule='evenodd'
          />
        </svg>
      );
    } else {
      svg = (
        <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
          <path
            fillRule='evenodd'
            d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z'
            clipRule='evenodd'
          />
        </svg>
      );
    }
    return svg;
  };

  return { isShowAccordion, setisShowAccordion, handleToggleAccordionView, returnUpDownIcon };
};
