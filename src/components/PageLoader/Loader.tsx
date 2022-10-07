import React, { LegacyRef } from 'react';
import { classNames } from '@/utils/commonFn';
import { ReactComponent as Oval } from 'imgs/loader/oval.svg';

interface IF {
  loaderRef: LegacyRef<HTMLDivElement>;
  isLoading: boolean;
}

const Loader: React.FC<IF> = (props: IF) => {
  const { loaderRef, isLoading } = props;
  return (
    <div
      ref={loaderRef}
      className={classNames`absolute top-1/2 left-1/2 transform z-50 -translate-x-1/2 -translate-y-1/2 ${
        isLoading ? '' : 'hidden'
      } `}
    >
      <Oval />
    </div>
  );
};
export default Loader;
