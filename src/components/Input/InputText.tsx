import React, { LegacyRef, ReactElement } from 'react';
import { FormikErrors } from 'formik';
import { classNames, returnIcon } from '@/utils/commonFn';

export interface InputProps {
  id?: string;
  name: string;
  label?: string | ReactElement;
  placeholder?: string;
  footer?: string;
  type?:'text' | 'email' | 'password' | 'tel' | 'number' | 'time' | 'date' | 'datetime-local' | 'hidden';
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  step?: 'any' | number;
  errMsg?: string | string[] | FormikErrors<any> | FormikErrors<any>[];
  onClick?: (e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, MouseEvent>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  autoComplete?: 'on' | 'off';
  value?: string | number | readonly string[];
  disabled?: boolean;
  readonly?: boolean;
  forwardedRef?: LegacyRef<HTMLInputElement>;
  // design related props
  design?: 'inputGroupHeader' | 'inputGroupFooter' | 'inputGroupHeaderFooter' | 'search' | 'normal';
  transformDirection?: 'intro-x' | 'intro-y';
  labelColor?: 'red';
  noLabelMargin?: boolean;
  noMarginTop?: boolean;
  marginRight?: boolean;
  required?: boolean;
}

const Input: React.FC<InputProps> = React.memo((props: InputProps) => {
  switch (props.design) {
    case 'inputGroupHeader':
      return (
        <div
          className={classNames` 
          ${props.noMarginTop ? null : 'mt-3'} 
          ${props.transformDirection ? props.transformDirection : 'intro-y'} 
           ${props.errMsg && 'has-error'}
           ${props.marginRight && 'mr-3'}
           
           `}
        >
          <div className={classNames`input-group mt-2 sm:mt-0`}>
            {props.label && (
              <label
                htmlFor={props.id}
                className={classNames`
                w-60 capitalize font-medium text-xs
                flex items-center
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
            <input
              ref={props.forwardedRef}
              id={props.id}
              type={props.type}
              min={props.min}
              max={props.max}
              maxLength={props.maxLength}
              minLength={props.minLength}
              step={props.step}
              className={classNames`form-control py-3 px-4 block`}
              placeholder={props.placeholder}
              name={props.name}
              onClick={(e) => props.onClick(e)}
              onChange={props.onChange}
              onKeyDown={props.onKeyDown}
              autoComplete={props.autoComplete}
              value={props.value}
              disabled={props.disabled}
              readOnly={props.readonly}
            />
          </div>
        </div>
      );

    case 'inputGroupFooter':
      return (
        <div
          className={classNames`
          ${props.noMarginTop ? null : 'mt-3'} 
          ${props.transformDirection ? props.transformDirection : 'intro-y'} 
          ${props.errMsg && 'has-error'}
          ${props.marginRight && 'mr-3'}`}
        >
          {props.label && (
            <label
              htmlFor={props.id}
              className={classNames`capitalize ${
                !props.noLabelMargin && `mt-3`
              } 
              ${props.labelColor === 'red' ? 'form-label--red' : 'form-label'}
              `}
            >
              {props.label}
            </label>
          )}
          <div
            className={classNames`input-group mt-2 sm:mt-0 
              `}
          >
            <input
              ref={props.forwardedRef}
              id={props.id}
              type={props.type}
              min={props.min}
              max={props.max}
              maxLength={props.maxLength}
              minLength={props.minLength}
              step={props.step}
              className='form-control py-3 px-4 block'
              placeholder={props.placeholder}
              name={props.name}
              onClick={(e) => props.onClick(e)}
              onChange={props.onChange}
              onKeyDown={props.onKeyDown}
              autoComplete={props.autoComplete}
              value={props.value}
              disabled={props.disabled}
              readOnly={props.readonly}
            />
            <div className='input-group-text'>{props.footer}</div>
          </div>
        </div>
      );

    case 'inputGroupHeaderFooter':
      return (
        <div
          className={classNames`
          ${props.noMarginTop ? null : 'mt-3'} 
        ${props.transformDirection ? props.transformDirection : 'intro-y'} 
         ${props.errMsg && 'has-error'}
         ${props.marginRight && 'mr-3'}`}
        >
          <div className={classNames`input-group mt-2 sm:mt-0 `}>
            {props.label && (
              <label
                htmlFor={props.id}
                className={classNames`
                w-60 capitalize font-medium text-xs
                flex items-center
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
            <input
              ref={props.forwardedRef}
              id={props.id}
              type={props.type}
              min={props.min}
              max={props.max}
              maxLength={props.maxLength}
              minLength={props.minLength}
              step={props.step}
              className='form-control py-3 px-4 block'
              placeholder={props.placeholder}
              name={props.name}
              onClick={(e) => props.onClick(e)}
              onChange={props.onChange}
              onKeyDown={props.onKeyDown}
              autoComplete={props.autoComplete}
              value={props.value}
              disabled={props.disabled}
              readOnly={props.readonly}
            />
            <div className='input-group-text'>{props.footer}</div>
          </div>
        </div>
      );

    case 'search':
      return (
        <div
          className={classNames`${
            props.noMarginTop ? null : 'mt-3'
          } w-full sm:w-auto sm:mt-0 sm:ml-auto md:ml-0 `}
        >
          <div className='search hidden sm:flex'>
            <input
              ref={props.forwardedRef}
              type='text'
              className='search__input--md form-control bg-dark-1 border-transparent placeholder-theme-8'
              placeholder='Search...'
              name={props.name}
              // onClick={(e) => props.onClick(e)}
              onChange={props.onChange}
              onKeyDown={props.onKeyDown}
              autoComplete={props.autoComplete}
              value={props.value}
              disabled={props.disabled}
              readOnly={props.readonly}
            />
            {returnIcon({
              icon: 'Search',
              className: 'search__icon text-white cursor-pointer',
            })}
          </div>
        </div>
      );

    default:
      return (
        <>
          {props.label && (
            <label
              htmlFor={props.id}
              className={classNames`capitalize ${
                !props.noLabelMargin && `mt-3`
              } 
              ${props.labelColor === 'red' ? 'form-label--red' : 'form-label'}
              `}
            >
              {props.label}
            </label>
          )}
          <div
            className={classNames`${props.label && ''}
            ${props.noMarginTop ? null : 'mt-3'} 
            ${props.errMsg && 'has-error'}
            ${props.marginRight && 'mr-3'}
            `}
          >
            <input
              ref={props.forwardedRef}
              id={props.id}
              type={props.type}
              min={props.min}
              max={props.max}
              step={props.step}
              className={classNames`${
                props.transformDirection ? props.transformDirection : 'intro-y'
              } form-control py-3 px-4 block`}
              placeholder={props.placeholder}
              name={props.name}
              onClick={(e) => props.onClick(e)}
              onChange={props.onChange}
              onKeyDown={props.onKeyDown}
              autoComplete={props.autoComplete ? props.autoComplete : 'off'}
              value={props.value}
              disabled={props.disabled}
              readOnly={props.readonly}
            />
          </div>
        </>
      );
  }
});
export default Input;

///////////////////////////////////////////////////////////////////////
interface TextareaProps extends InputProps {
  rows?: number;
  cols?: number;
}
export function Textarea(props: TextareaProps) {
  switch (props.design) {
    case 'inputGroupHeader':
      return (
        <div
          className={classNames` 
            ${props.noMarginTop ? null : 'mt-3'} 
            ${props.transformDirection ? props.transformDirection : 'intro-y'} 
            ${props.errMsg && 'has-error'}
            ${props.marginRight && 'mr-3'}           
           `}
        >
          <div className={classNames`input-group mt-2 sm:mt-0`}>
            {props.label && (
              <label
                htmlFor={props.id}
                className={classNames`
                  w-60 capitalize font-medium text-xs
                  flex items-center
                  ${props.labelColor === 'red' ? 'input-group-text--red' : 'input-group-text'}
                `}
              >
                {props.label}
              </label>
            )}
            <textarea
              name={props.name}
              ref={props.forwardedRef as LegacyRef<HTMLTextAreaElement>}
              id={props.id}
              cols={props.cols}
              rows={props.rows}
              className='form-control py-3 px-4 block'
              placeholder={props.placeholder}
              onClick={(e) => props.onClick(e)}
              onChange={props.onChange}
              value={props.value}
              disabled={props.disabled}
              readOnly={props.readonly}
              onBlur={(e) => props.onBlur && props.onBlur(e)}
            />
          </div>
        </div>
      );

    default:
      return (
        <>
          {props.label && (
            <label
              htmlFor={props.id}
              className={classNames`capitalize ${
                !props.noLabelMargin && `mt-3`
              } 
                ${props.labelColor === 'red' && 'form-label--red'}
                `}
            >
              {props.label}
            </label>
          )}
          <div
            className={classNames`${props.label && 'mt-2'} 
            ${props.errMsg && 'has-error'}
            ${props.noMarginTop ? null : 'mt-3'} 
            `}
          >
            <textarea
              name={props.name}
              ref={props.forwardedRef as LegacyRef<HTMLTextAreaElement>}
              id={props.id}
              cols={props.cols}
              rows={props.rows}
              className={classNames`${
                props.transformDirection ? props.transformDirection : 'intro-y'
              } form-control py-3 px-4 block`}
              placeholder={props.placeholder}
              onClick={(e) => props.onClick(e)}
              onChange={props.onChange}
              value={props.value}
              disabled={props.disabled}
              readOnly={props.readonly}
              onBlur={(e) => props.onBlur && props.onBlur(e)}
            />
          </div>
        </>
      );
  }
};
