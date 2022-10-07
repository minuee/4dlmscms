import { returnIcon } from '@/utils/commonFn';
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CMS_CONTENT } from 'sets/constants';
interface BreadcrumbProps {}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({}: BreadcrumbProps) => {
  const [paths, setPaths] = useState<string[]>([]);
  const location = useLocation();
  let pathUrl = '';

  useEffect(() => {
    const paths = location.pathname.split('/');
    setPaths([...paths]);
    pathUrl = '';
  }, [location]);

  return (
    <div className='mr-auto -intro-x breadcrumb'>
      {paths.map((path, index) => {
        pathUrl =
          index === 0
            ? '/'
            : pathUrl === '/'
            ? pathUrl + paths[index]
            : pathUrl + '/' + paths[index];

        return index === 0 ? (
          <div key='breadcrumb__home' className='flex items-center capitalize'>
            <Link to={CMS_CONTENT}>Home</Link>
            {location.pathname !== '/' &&
              returnIcon({
                icon: 'ChevronRignt',
                className: 'breadcrumb__icon',
              })}
          </div>
        ) : (
          <div
            key={`${index}_${pathUrl}`}
            className='flex items-center capitalize'
          >
            <Link to={pathUrl}>
              {path.includes('Item')
                ? path.substring(0, path.length - 4) // createItem에서 create만 남겨둔다.
                : path}
            </Link>
            {index + 1 !== paths.length &&
              returnIcon({
                icon: 'ChevronRignt',
                className: 'breadcrumb__icon',
              })}
          </div>
        );
      })}
    </div>
  );
};
