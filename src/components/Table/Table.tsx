import React, { ReactChild } from 'react';
import { classNames } from '../../utils/commonFn';

//////////// start of css
// TODO: responsive(밑으로 내려가는거), default(그냥 스크롤로)로 나누기
// -> total table 안 쓰면 스크롤, 쓰면 밑으로 내려가는 거
//////////// end of css
/////////////////////////////////////////////////////////////

export const TableTotal: React.FC<WithChildren> = ({ children }: WithChildren) => {
  return <div className='table_wrapper'>{children}</div>;
};

export const Table: React.FC<WithChildren> = ({ children }: WithChildren) => {
  return <table className='table_flex'>{children}</table>;
};

/////////////////////////////////////////////
// Thead starts
type TheadColorType =
  | 'thead-primary'
  | 'thead-secondary'
  | 'thead-lightblue'
  | 'thead-transparent'
  | 'thead-dark';

interface TheadProps {
  color?: TheadColorType;
  first?: boolean;
}

export const TheadWrapper: React.FC<TheadProps & WithChildren> = (props: TheadProps & WithChildren) => {
  return (
    <thead className={classNames`thead ${!props.first && `block sm:hidden`}`}>
      {props.children}
    </thead>
  );
};
// Thead ends
/////////////////////////////////////////////

// th
interface ThProps {
  title?: string;
}
export const TH: React.FC<ThProps & WithChildren> = (props: ThProps & WithChildren) => {
  return (
    <th className='th' scope='col'>
      {props.children ? props.children : props.title}
    </th>
  );
};

/////////////////////////////////////////////
// Tbody starts
type TbodyColorType =
  | 'tbody-primary'
  | 'tbody-secondary'
  | 'tbody-lightblue'
  | 'tbody-transparent';

interface TbodyProps {
  color?: TbodyColorType;
}

export const TbodyWrapper: React.FC<TbodyProps & WithChildren> = (props: TbodyProps & WithChildren) => {
  return (
    <tbody className={classNames`tbody ${props.color}`}>{props.children}</tbody>
  );
};
// Tbody ends
/////////////////////////////////////////////

/////////////////////////////////////////////
// Tbody starts
// tr
type TrColorType =
  | 'tr-primary'
  | 'tr-secondary'
  | 'tr-lightblue'
  | 'tr-transparent';

interface TrProps {
  color?: TrColorType;
  id?: string;
}
export const TR: React.FC<TrProps & WithChildren> = (props: TrProps & WithChildren) => {
  return <tr className={classNames`tr ${props.color}`}>{props.children}</tr>;
};
// tr ends
/////////////////////////////////////////////

/////////////////////////////////////////////
// td starts
interface TdProps {
  id?: string;
  title?: string;
  value: React.ReactNode | React.FC | ReactChild;
  align?: 'left' | 'right' | 'center';
}
export const TD: React.FC<TdProps> = (props: TdProps) => {
  return <td className='td'>{props.value}</td>;
};
