import React from 'react';
import { classNames } from '@/utils/commonFn';
import { InputProps } from './InputText';

// Option
interface OptionProps {
  value: string | number;
  label: string;
  id?: string;
}

export const Option: React.FC<OptionProps> = (props: OptionProps) => {
  return (
    <option
      id={props.id}
      className={classNames`capitalize`}
      value={props.value}
    >
      {props.label}
    </option>
  );
};

// Select
interface SelectProps extends InputProps {
  noMarginTop?: boolean;
  design?: 'inputGroupHeader' | 'normal';
}

const Select: React.FC<SelectProps & WithChildren> = (
  props: SelectProps & WithChildren
) => {
  switch (props.design) {
    case 'inputGroupHeader':
      return (
        <div
          className={classNames` 
        ${props.noMarginTop ? null : 'mt-3'} 
        ${props.transformDirection ? props.transformDirection : 'intro-y'} 
        `}
        >
          <div
            className={classNames`input-group mt-2 sm:mt-0 
            ${props.errMsg && 'has-error'}`}
          >
            {props.label && (
              <label
                htmlFor={props.id}
                className={classNames`
                w-40 capitalize
                ${
                  props.labelColor === 'red'
                    ? 'input-group-text--red'
                    : 'input-group-text'
                }    
                `}
              >
                {props.label}
              </label>
            )}
            <select
              name={props.name}
              id={props.id}
              className={classNames`form-control form-select py-3 px-4 block`}
              data-search='true'
              placeholder={props.placeholder}
              onClick={(e) => props.onClick && props.onClick(e)}
              onChange={props.onChange}
              autoComplete={props.autoComplete}
              value={props.value}
              disabled={props.disabled}
            >
              {props.children}
            </select>
          </div>
        </div>
      );

    default:
      return (
        <>
          {props.label && (
            <label
              htmlFor={props.id}
              className={classNames`capitalize  
              form-label 
              ${!props.noLabelMargin && `mt-3`}
              ${props.labelColor === 'red' && 'form-label--red'}
              `}
            >
              {props.label}
            </label>
          )}
          <div
            className={classNames`
            ${props.errMsg && 'has-error'}
            ${props.label ? '' : props.noMarginTop ? '' : 'mt-4'}`}
          >
            <select
              name={props.name}
              id={props.id}
              className={classNames`tail-select w-full form-select py-3 px-4  
              ${
                props.transformDirection ? props.transformDirection : 'intro-y'
              } 
             `}
              data-search='true'
              placeholder={props.placeholder}
              onClick={(e) => props.onClick && props.onClick(e)}
              onChange={props.onChange}
              autoComplete={props.autoComplete}
              value={props.value}
              disabled={props.disabled}
            >
              {props.children}
            </select>
          </div>
        </>
      );
  }
};
export default Select;
