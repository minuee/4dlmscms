import React from 'react';
import { classNames } from '../../utils/commonFn';
import { InputProps } from './InputText';

// TODO: checkbox icon 도 커스텀하기
export interface CheckboxProps extends Partial<InputProps> {
  boxSize?: 'sm' | 'md' | 'lg' | 'xl';
  checked?: boolean;
  noMinWidth?: boolean;
}
const Checkbox: React.FC<CheckboxProps> = React.memo((props) => {
  return (
    <div
      className={classNames`${
        props.transformDirection ? props.transformDirection : 'intro-y'
      } flex-none flex items-center text-xs sm:text-sm
      ${props.noMinWidth ? '' : 'min-w-24 '}
      `}
    >
      <input
        id={props.id}
        name={props.name}
        type='checkbox'
        className={classNames`form-check-input border mr-3 ${
          props.errMsg ? 'has-error' : ''
        }`}
        checked={props.checked}
        onChange={(e) => props.onChange(e)}
      />
      <label className='cursor-pointer' htmlFor={props.id}>
        {props.label}
      </label>
    </div>
  );
});

export default Checkbox;
