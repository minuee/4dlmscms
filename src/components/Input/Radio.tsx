import React from 'react';
import { classNames } from '../../utils/commonFn';
import { InputProps } from './InputText';

interface RadioProps extends Partial<InputProps> {
  radiotype?: 'normal' | 'block' | 'blockChild';
  radiosize?: 'sm' | 'md' | 'lg' | 'xl';
}

export const RadioBlockTypeWrapper = (props: WithChildren) => {
  return (
    <div role='group' aria-labelledby='my-radio-group'>
      <ul
        className={classNames`p-1 filter-switch inline-flex items-center relative h-10 space-x-1 bg-dark-5 bg-opacity-80 rounded-md font-semibold text-blue-600`}
      >
        {props.children}
      </ul>
    </div>
  );
};

export const Radio: React.FC<RadioProps & WithChildren> = (
  props: RadioProps & WithChildren
) => {
  switch (props.radiotype) {
    case 'blockChild':
      return (
        <li className='filter-switch-item flex relative h-8 bg-dark-5 shadow-lg rounded-md'>
          <input
            id={props.id}
            className='sr-only'
            type='radio'
            name={props.name}
            value={props.value}
          />
          <label
            className='cursor-pointer h-8 py-1 px-2 text-sm leading-6 text-gray-400 hover:text-primary-1 shadow-none bg-opacity-0 label-checked:text-inherit label-checked:text-white label-checked:bg-primary-1 label-checked:shadow label-checked:rounded'
            htmlFor={props.id}
          >
            {props.label}
          </label>
        </li>
      );

    // 디폴트는 일반 라디오
    default:
      return (
        <div className='form-check mr-2'>
          <input
            id={props.id}
            className='form-check-input'
            type='radio'
            name={props.name}
            value={props.value}
          />
          <label className='form-check-label' htmlFor={props.id}>
            {props.label}
          </label>
        </div>
      );
  }
};
