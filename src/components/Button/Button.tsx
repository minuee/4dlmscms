import React from 'react';
import { useTranslation } from 'react-i18next';

import { classNames } from '@/utils/commonFn';

// TODO: 디자인은 따로 빼고, font-size, 대문자(소문자,capital)여부 등 공통적으로 적용할 수 있는 애들은 따로 빼두기
// type
type ButtonSizes = 'btn-sm' | 'btn-md' | 'btn-lg';
type ButtonWidth = 'btn-max' | 'btn-full';
type ButtonColors =
  | 'btn-primary'
  | 'btn-secondary'
  | 'btn-success'
  | 'btn-warning'
  | 'btn-danger'
  | 'btn-dark';
type ButtonElevated =
  | 'btn-elevated'
  | 'btn-elevated-primary'
  | 'btn-elevated-secondary'
  | 'btn-elevated-success'
  | 'btn-elevated-warning'
  | 'btn-elevated-danger'
  | 'btn-elevated-dark';

type ButtonRounded =
  | 'btn-rounded'
  | 'btn-rounded-primary'
  | 'btn-rounded-secondary'
  | 'btn-rounded-secondary'
  | 'btn-rounded-success'
  | 'btn-rounded-warning'
  | 'btn-rounded-danger';

type ButtonElevatedRounded =
  | 'btn-elevated-rounded'
  | 'btn-elevated-rounded-primary'
  | 'btn-elevated-rounded-secondary'
  | 'btn-elevated-rounded-success'
  | 'btn-elevated-rounded-warning'
  | 'btn-elevated-rounded-danger'
  | 'btn-elevated-rounded-primary'
  | 'btn-elevated-rounded-dark';

type ButtonOutline =
  | 'btn-outline-primary'
  | 'btn-outline-secondary'
  | 'btn-outline-success'
  | 'btn-outline-warning'
  | 'btn-outline-danger'
  | 'btn-outline-dark';

type ButtonSoft =
  | 'btn-primary-soft'
  | 'btn-secondary-soft'
  | 'btn-success-soft'
  | 'btn-warning-soft'
  | 'btn-danger-soft'
  | 'btn-dark-soft';

type ButtonOnlyText =
  | 'btn-only-text'
  | 'btn-only-text-primary'
  | 'btn-only-text-secondary'
  | 'btn-only-text-success'
  | 'btn-only-text-danger'
  | 'btn-only-text-warning'
  | 'btn-only-text-dark';

type AlignLeft =
  | 'btns-wrapper-align-left-top'
  | 'btns-wrapper-align-left-bottom';

export interface ButtonProps extends WithChildren {
  href?: string;
  type?: 'button' | 'submit';
  size?: ButtonSizes;
  width?: ButtonWidth;
  color?: ButtonColors;
  elevated?: ButtonElevated;
  round?: ButtonRounded;
  elevatedrounded?: ButtonElevatedRounded;
  outline?: ButtonOutline;
  soft?: ButtonSoft;
  onlytext?: ButtonOnlyText;
  form?: string;
  AlignLeft?: AlignLeft;
  disabled?: boolean;
  margin?: 'left' | 'right' | 'top';
  onClick?: (any?) => void;
  id?: string;
}

const Button: React.FC<ButtonProps> = React.memo((props: ButtonProps) => {
  if (props.href) {
    return (
      <a
        href={props.href}
        className={classNames`btn items-center ${props.width} ${props.size} ${
          props.color
        } ${props.elevated} ${props.round} ${props.elevatedrounded} ${
          props.outline
        } ${props.soft} ${props.onlytext && `btn-only-text`} ${props.AlignLeft}
          ${props.disabled && 'disabled cursor-not-allowed!'}
          ${props.margin === 'left' && 'ml-4'}
          ${props.margin === 'right' && 'mr-4'}
          ${props.margin === 'top' && 'mt-4'}`}
        id={props.id}
      >
        {props.children}
      </a>
    );
  } else {
    return (
      <button
        type={props.type || 'button'}
        onClick={props.onClick}
        className={classNames`btn items-center ${props.width} ${props.size} 
          ${props.color} ${props.elevated} ${props.round} ${
          props.elevatedrounded
        } 
          ${props.outline} ${props.soft} ${props.onlytext && `btn-only-text`} 
          ${props.AlignLeft}
          ${props.disabled && 'cursor-not-allowed!'}
          ${props.margin === 'left' && 'ml-4'}
          ${props.margin === 'right' && 'mr-4'}
          ${props.margin === 'top' && 'mt-4'}`}
        id={props.id}
        form={props.form}
        disabled={props.disabled}
      >
        {props.children}
      </button>
    );
  }
});

Button.defaultProps = {
  // color: "btn-primary",
};

export const ButtonEdit = (props: Onclick) => {
  return (
    <button
      className='flex items-center mr-3  hover:text-base'
      onClick={props.onClick}
    >
      Edit
    </button>
  );
};

export const ButtonAdd = (props: Onclick) => {
  return (
    <button className='btn px-2 box text-gray-300 ml-2' onClick={props.onClick}>
      <span className='w-5 h-5 flex items-center justify-center'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='h-5 w-5'
          viewBox='0 0 20 20'
          fill='currentColor'
        >
          <path
            fillRule='evenodd'
            d='M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z'
            clipRule='evenodd'
          />
        </svg>
      </span>
    </button>
  );
};

export const ButtonDelete = (props: Onclick) => {
  return (
    <button
      className='flex items-center text-theme-24 hover:text-base'
      onClick={props.onClick}
    >
      {/* <i className='w-4 h-4 mr-1 far fa-trash-alt'></i> */}
      Delete
    </button>
  );
};

export const ButtonInputAdd = (props) => {
  const { t } = useTranslation();

  return (
    <svg
      id={props.id}
      xmlns='http://www.w3.org/2000/svg'
      className={props.isHide ? 'hidden' : 'h-4 w-4 mt-2 ml-3 cursor-pointer'}
      viewBox='0 0 20 20'
      fill='currentColor'
      data-tip={t(props.text)}
      onClick={props.onClick}
    >
      <path
        fillRule='evenodd'
        d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z'
        clipRule='evenodd'
      />
    </svg>
  );
};

export default Button;
