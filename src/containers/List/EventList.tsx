import React, { useEffect, useState, useRef, lazy } from 'react';
import ReactTooltip from 'react-tooltip';
import { useTranslation } from 'react-i18next';

import { classNames, returnIcon } from '@/utils/commonFn';

const Checkbox = lazy(() => import('comp/Input/Checkbox'));
/*
item
*/
interface EventItemProps {
  creatDate?: Date | string;
  updateDate?: Date | string;
  id: string;
  name: string;
  checkboxValue?: string | number | readonly string[];
  checkboxLabel?: string;
  checkboxOnChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  content?: string | number | boolean;
  onClick?: (any) => void;
  selected?: boolean;
}

let mounted = false;

export const EventItem: React.FC<EventItemProps> = React.memo(
  (props: EventItemProps) => {
    return (
      <li
        id={props.id}
        className='intro-y mb-0.5'
        onClick={() => props.onClick(props.id)}
      >
        <div className='inbox__item w-full inline-block sm:block text-gray-500 bg-dark-1 border-b border-dark-1'>
          <div
            className={classNames`flex items-center px-5 py-3 overflow-hidden ${
              props.selected && ` border-4 border-primary-1`
            }`}
          >
            <Checkbox
              id={props.id}
              name={props.name}
              value={props.checkboxValue}
              label={props.checkboxLabel}
              onChange={props.checkboxOnChange}
            />
            <span className='ml-5 w-64 sm:w-auto truncate'>
              {props.content}
            </span>
          </div>
        </div>
      </li>
    );
  }
);

/////////////////////////////////////////////////////////////
/*
list
*/
interface EventListProps {
  height?: string;
  listName?: string;
  onAdd?: () => void;
  onDelete?: () => void;
}

export const EventList: React.FC<EventListProps> = (
  props: EventListProps & WithChildren
) => {
  const elemRef = useRef<HTMLUListElement>();
  const { t } = useTranslation();

  const [height, setHeight] = useState<number>(0);
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [isCheckingHeight, setIsCheckingHeight] = useState<boolean>(true);

  useEffect(() => {
    if (!mounted) mounted = true;
  }, []);

  useEffect(() => {
    handleResize();
  }, [elemRef, windowWidth]);

  const handleResize = () => {
    if (!elemRef) return;
    const screenWidth = window.outerWidth;
    setWindowWidth(screenWidth);
    screenWidth < 1024 ? setIsCheckingHeight(false) : setIsCheckingHeight(true);
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      // cleanup
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!isCheckingHeight) return;
    // 화면 사이즈 측정해서 작은 화면일 때는 자기 원래 높이로 돌아오기
    const height = document.querySelector(`#${props.height}`).clientHeight;
    height && setHeight(height);
  }, [mounted, isCheckingHeight]);

  const handleDeleteItems = () => {
    props.onDelete();
  };

  return (
    <div className='col-span-12 lg:col-span-5 xl:col-span-6 flex lg:block flex-col-reverse'>
      <div className='intro-y box mt-5 '>
        <div className='flex items-center px-5 py-3 border-b border-dark-5 h-16'>
          <h2 className='font-medium text-base capitalize mr-4'>
            {props.listName}
          </h2>
          {/* <Info
            className='cursor-pointer mr-auto '
            data-tip={t('event:addItemToListInfo')}
          /> */}
          {returnIcon({
            icon: 'Info',
            className: 'cursor-pointer mr-auto',
            dataTip: t('event:addItemToListInfo'),
          })}
          <ReactTooltip />
          <div className='w-full sm:w-auto flex'>
            {/* 추가버튼 */}
            {/* <button
              className='btn px-2 box text-gray-300 bg-dark-1'
              onClick={props.onAdd}
            >
              <span className='w-5 h-5 flex items-center justify-center'>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
</svg>
              </span>
            </button> */}
            {/* 삭제버튼 */}
            <button
              type='button'
              className='btn box text-gray-300 bg-dark-1 ml-2'
              onClick={handleDeleteItems}
            >
              <span className='w-5 h-5 flex items-center justify-center'>
                {returnIcon({ icon: 'Trash' })}
              </span>
            </button>
          </div>
        </div>

        <ul
          ref={elemRef}
          className='inbox overflow-x-auto overflow-y-scroll sm:overflow-x-visible p-2'
          style={
            isCheckingHeight ? { height: `${height}px` } : { height: 'auto' }
          }
        >
          {props.children}
        </ul>
      </div>
    </div>
  );
};
