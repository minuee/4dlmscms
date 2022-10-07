import React from 'react';
import { classNames } from '@/utils/commonFn';
import { CheckboxProps } from './Checkbox';

interface ToggleProps extends CheckboxProps {
  tabIndex?: number;
}

const Toggle: React.FC<ToggleProps> = React.memo((props) => {
  return (
    <div className={classNames`mt-3`}>
      <div className={classNames`form-check ${props.transformDirection ? props.transformDirection : 'intro-y'} ${props.marginRight && 'mr-3'}`}>
        <input
          className='form-check-switch'
          id={props.id}
          type='checkbox'
          name={props.name}
          value={props.value}
          checked={props.checked}
          onChange={props.onChange}
          tabIndex={props.tabIndex}
          readOnly={props.readonly}
        />
        <label className='form-check-label' htmlFor={props.id} tabIndex={props.tabIndex}>
          {props.label}
        </label>
      </div>
    </div>
  );
});

export default Toggle;
