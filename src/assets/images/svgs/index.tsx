import React from 'react';
import { classNames } from '@/utils/commonFn';

const X = (props) => {
  return (
    // <svg
    //   xmlns='http://www.w3.org/2000/svg'
    //   className={classNames`h-6 w-6 ${props?.className}`}
    //   fill='none'
    //   viewBox='0 0 24 24'
    //   data-tip={props?.dataTip}
    // >
    //   <path
    //     strokeLinecap='round'
    //     strokeLinejoin='round'
    //     strokeWidth={2}
    //     d='M6 18L18 6M6 6l12 12'
    //   />
    // </svg>
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={classNames`feather feather-toggle-right ${props?.className}`}
      data-tip={props?.dataTip}
    >
      <line x1='18' y1='6' x2='6' y2='18'></line>
      <line x1='6' y1='6' x2='18' y2='18'></line>
    </svg>
  );
};

const ChevronRignt = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      className={classNames`h-6 w-6 ${props?.className}`}
      fill='none'
      viewBox='0 0 24 24'
      stroke='currentColor'
      data-tip={props?.dataTip}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M9 5l7 7-7 7'
      />
    </svg>
  );
};

const Info = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      className={classNames`h-6 w-6 ${props?.className}`}
      fill='none'
      viewBox='0 0 24 24'
      stroke='currentColor'
      data-tip={props?.dataTip}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      />
    </svg>
  );
};

const Search = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      className={classNames`h-6 w-6 ${props?.className}`}
      fill='none'
      viewBox='0 0 24 24'
      stroke='currentColor'
      data-tip={props?.dataTip}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
      />
    </svg>
  );
};

const User = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      className={classNames`h-6 w-6 ${props?.className}`}
      fill='none'
      viewBox='0 0 24 24'
      stroke='currentColor'
      data-tip={props?.dataTip}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
      />
    </svg>
  );
};

const Document = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      className={classNames`h-6 w-6 ${props?.className}`}
      fill='none'
      viewBox='0 0 24 24'
      stroke='currentColor'
      data-tip={props?.dataTip}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
      />
    </svg>
  );
};

const Lock = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      className={classNames`h-6 w-6 ${props?.className}`}
      fill='none'
      viewBox='0 0 24 24'
      stroke='currentColor'
      data-tip={props?.dataTip}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
      />
    </svg>
  );
};

const ToggleRight = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={classNames`feather feather-toggle-right ${props?.className}`}
      data-tip={props?.dataTip}
    >
      <rect x='1' y='5' width='22' height='14' rx='7' ry='7'></rect>
      <circle cx='16' cy='12' r='3'></circle>
    </svg>
  );
};

const Bell = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      className={classNames`h-6 w-6 ${props?.className}`}
      fill='none'
      viewBox='0 0 24 24'
      stroke='currentColor'
      data-tip={props?.dataTip}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
      />
    </svg>
  );
};

const Globe = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      className={classNames`h-6 w-6 ${props?.className}`}
      fill='none'
      viewBox='0 0 24 24'
      stroke='currentColor'
      data-tip={props?.dataTip}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9'
      />
    </svg>
  );
};

const BarChart = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      className={classNames`h-6 w-6 ${props?.className}`}
      fill='none'
      viewBox='0 0 24 24'
      stroke='currentColor'
      data-tip={props?.dataTip}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
      />
    </svg>
  );
};

const Trash = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      className={classNames`h-6 w-6 ${props?.className}`}
      fill='none'
      viewBox='0 0 24 24'
      stroke='currentColor'
      data-tip={props?.dataTip}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
      />
    </svg>
  );
};

const ChevronDown = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      className={classNames`h-6 w-6 ${props?.className}`}
      fill='none'
      viewBox='0 0 24 24'
      stroke='currentColor'
      data-tip={props?.dataTip}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M19 9l-7 7-7-7'
      />
    </svg>
  );
};

const EditPencil = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      className={classNames`h-6 w-6 ${props?.className}`}
      fill='none'
      viewBox='0 0 24 24'
      stroke='currentColor'
      data-tip={props?.dataTip}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
      />
    </svg>
  );
};

const CheckCircle = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      className={classNames`h-6 w-6 ${props?.className}`}
      fill='none'
      viewBox='0 0 24 24'
      stroke='currentColor'
      data-tip={props?.dataTip}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
      />
    </svg>
  );
};

const AlertTriangle = (props) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      className={classNames`h-6 w-6 ${props?.className}`}
      fill='none'
      viewBox='0 0 24 24'
      stroke='currentColor'
      data-tip={props?.dataTip}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
      />
    </svg>
  );
};

const Icons = {
  X,
  ChevronRignt,
  Info,
  Search,
  User,
  Document,
  Lock,
  ToggleRight,
  Bell,
  Globe,
  BarChart,
  Trash,
  ChevronDown,
  EditPencil,
  CheckCircle,
  AlertTriangle,
};
export default Icons;
