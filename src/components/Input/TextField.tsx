import React from 'react';
import { useField } from 'formik';
import styled from 'styled-components';
import tw from 'twin.macro';

import { classNames } from '../../utils/commonFn';

import {
  FIELD_SIZE_VARIANT_MAPS,
  FONT_SIZE_VARIANT_MAPS,
  TEXT_TRANSFORM_VARIANT_MAPS,
  ROUND_VARIANT_MAPS,
  COLOR_VARIANT_MAPS,
  BGCOLOR_VARIANT_MAPS,
  RING_COLOR_VARIANT_MAPS,
  RING_WIDTH_VARIANT_MAPS,
  BORDER_COLOR_VARIANT_MAPS,
  BORDER_WIDTH_VARIANT_MAPS,
  DISABLED_VARIANT_MAPS,
  BOX_SIZE_VARIANT_MAPS,
} from '@/assets/styles/helpers/tailwindCommon';

///////////////////////
//// common props starts
///////////////////////

export interface InputProps {
  name: string;
  id?: string;
  label: string;
  nolabel?: boolean;
  align?: 'inline-flex' | '';
  // design?: "filled" | "outlined"; //dashed, dotted..
  disabled?: boolean;
  color?: 'white' | 'black' | 'gray' | 'primary' | 'secondary' | 'danger';
  bgcolor?: 'white' | 'black' | 'gray' | 'primary' | 'secondary' | 'danger';
  ringcolor?:
    | 'white'
    | 'black'
    | 'gray'
    | 'primary'
    | 'secondary'
    | 'danger'
    | 'transparent'
    | 'current';
  bordercolor?:
    | 'white'
    | 'black'
    | 'gray'
    | 'primary'
    | 'secondary'
    | 'danger'
    | 'transparent'
    | 'current';
  ringwidth?: 'sm' | 'md' | 'lg';
  texttransform?: 'uppercase' | 'capitalize' | 'lowercase';
  fieldsize?: 'sm' | 'md' | 'lg' | 'full' | 'auto';
  rounded?: 'sm' | 'md' | 'lg' | 'full';
  textsize?: 'sm' | 'base' | 'lg' | 'xl';
  customstyle?: string;
  labelcustomstyle?: string;
  borderwidth?: 'sm' | 'base' | 'lg' | 'xl';
  // borderStyle?:"rectangle"|"round-all"|"round-"
}

///////////////////////
//// common props end
///////////////////////

/* styled components starts */
// 서치바 관련 css
const InputTextSearchBar = styled.div`
  /* flex  items-center border border-gray-200 rounded-2xl px-4  origin-top-left transition duration-200 ease-out transform focus-within:scale-x-150  */
  position: relative;
  display: flex;
  align-items: center;
  border: 1px gainsboro solid;
  border-radius: 1rem;
  padding: 0 1rem;
  transform-origin: top left;
  transition: all 0.2s ease-out;
  width: 10rem;
  height: 2.2rem;

  &:focus-within {
    width: 20rem;

    & > .autoComplete {
      display: block;
    }
  }
`;

type InputTextWrapperProps = {
  rounded?: rounded;
  borderwidth?: 'sm' | 'base' | 'lg' | 'xl';
};

const InputTextWrapper = styled.div.attrs((props: InputTextWrapperProps) => ({
  className: classNames`focus-within:border-red-700 px-4 py-2 border-red-500 relative ml-16
   ${ROUND_VARIANT_MAPS[props.rounded]}
   ${BORDER_WIDTH_VARIANT_MAPS[props.borderwidth]}
   `,
}))<InputTextWrapperProps>`
  > input {
    ${tw`appearance-none border-2 border-transparent rounded w-full py-2 text-gray-500 leading-tight focus:outline-none focus:bg-white focus:border-white  `}
    &:focus + label {
      margin: -1rem 0.3rem;
      background-color: white;
      font-size: 1rem;
      color: rgba(185, 28, 28, 1);
    }
  }
  > input + label {
    position: absolute;
    left: 0;
    top: 0;
    margin: 0.7rem 0.3rem;
    padding: 0 0.3rem;
    background-color: transparent;
    color: red;
    font-size: 1.2rem;
    transition: all ease 0.2s;
  }
`;

// 에러 메시지 출력 div
export const ErrorDivWrapper = styled.div.attrs({
  className: classNames`ml-1 text-red-500 text-sm	mt-1`,
})``;

/* styled components ends */

interface InputTextProps extends InputProps {
  type: 'email' | 'text' | 'password';
  inputtype?:
    | 'normal'
    | 'textarea'
    | 'searchBar'
    | 'outlined'
    | 'outlinedWithAnim'
    | 'dashed'
    | 'filled';
  //multiline일 경우 textarea
  // multiLine?: boolean;
  // search input box
  // searchbar?: "true" | "false";
  placeholder?: string;
  autoComplete?: 'on' | 'off';
  // $inputTest?: string; // styled-components error test 목적
}

////****************************** */
// inputText
////****************************** */
export const Input: React.FC<InputTextProps> = (props: InputTextProps) => {
  const [field, { error, touched }] = useField({
    name: props.name,
  });

  // TODO: maxLength넘기면 다음 인풋에 포커스 주기
  const checkInputLength = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };

  switch (props.inputtype) {
    // 2. textArea일 경우
    case 'textarea':
      return (
        // <div className={`w-full`}>
        <textarea
          className={classNames`form-input border border-transparent focus:border-transparent	rounded-md 
          ${COLOR_VARIANT_MAPS[props.color]}
          ${TEXT_TRANSFORM_VARIANT_MAPS[props.texttransform]}
          ${RING_COLOR_VARIANT_MAPS[props.ringcolor]}
          ${RING_WIDTH_VARIANT_MAPS[props.ringwidth]}
          ${FIELD_SIZE_VARIANT_MAPS[props.fieldsize]}
          ${BGCOLOR_VARIANT_MAPS[props.bgcolor]}
          ${FONT_SIZE_VARIANT_MAPS[props.textsize]}
          ${ROUND_VARIANT_MAPS[props.rounded]}
          ${props.customstyle && props.customstyle}
          ${props.disabled && DISABLED_VARIANT_MAPS['text']}
  
          `}
          {...field}
          {...props}
        ></textarea>
        // </div>
      );
    // 3. 서치바일 경우
    case 'searchBar':
      return (
        <div className={classNames` ${props.customstyle && props.customstyle}`}>
          <InputTextSearchBar>
            <button className='searchIcon focus:outline-none transform hover:scale-110'>
              <svg
                className='w-6 text-gray-600'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </button>
            <input
              className={classNames`form-input border border-transparent focus:border-transparent
                bg-transparent
              ${COLOR_VARIANT_MAPS[props.color]}
              ${TEXT_TRANSFORM_VARIANT_MAPS[props.texttransform]}
              ${RING_COLOR_VARIANT_MAPS[props.ringcolor]}
              ${RING_WIDTH_VARIANT_MAPS[props.ringwidth]}
              ${FIELD_SIZE_VARIANT_MAPS[props.fieldsize]}
              ${BGCOLOR_VARIANT_MAPS[props.bgcolor]}
              ${FONT_SIZE_VARIANT_MAPS[props.textsize]}
              ${ROUND_VARIANT_MAPS[props.rounded]}
              ${props.disabled && DISABLED_VARIANT_MAPS['text']}
            
              `}
              {...field}
              {...props}
            />
            {/* 자동완성 텍스트 보여주는 div */}
            {field.value && (
              <div className='autoComplete hidden absolute min-w-full max-w-full top-8 mt-1 -left-0.25 shadow-2xl p-4 rounded-md bg-white z-20'>
                {field.value}
              </div>
            )}
            {error && touched && <div className={``}>{error}</div>}
          </InputTextSearchBar>
        </div>
      );
    // 4. 아웃라인 버전일 경우(애니메이션 효과 없이)
    //TODO: 4, 5번도 색깔, 보더 등 바꿀 수 있게 하기
    case 'outlined':
      return (
        <div
          className={classNames`px-4 py-2 relative  
          ${props.rounded ? ROUND_VARIANT_MAPS[props.rounded] : `rounded`}
          ${
            props.borderwidth
              ? BORDER_WIDTH_VARIANT_MAPS[props.borderwidth]
              : `border-2`
          }
          ${props.color ? COLOR_VARIANT_MAPS[props.color] : `border-gray-200`}
          ${props.bgcolor ? BGCOLOR_VARIANT_MAPS[props.bgcolor] : `bg-white`}
          ${FIELD_SIZE_VARIANT_MAPS[props.fieldsize]}

          `}
        >
          <label
            className={classNames`absolute -my-6 -mx-2 px-2 
            ${props.color ? COLOR_VARIANT_MAPS[props.color] : `text-gray-500`}
            ${props.bgcolor ? BGCOLOR_VARIANT_MAPS[props.bgcolor] : `bg-white`}
            `}
          >
            {props.label}
          </label>
          <input
            type={props.type}
            className={classNames`w-full py-2 leading-tight appearance-none rounded
            focus:outline-none focus:bg-white focus:border-white
            ${props.color ? COLOR_VARIANT_MAPS[props.color] : `border-gray-200`}
            ${props.bgcolor ? BGCOLOR_VARIANT_MAPS[props.bgcolor] : `bg-white`}
            `}
            placeholder={props.placeholder ? props.placeholder : ''}
          />
        </div>
      );
    // 5. 아웃라인 버전일 경우(애니메이션 효과 포함)
    case 'outlinedWithAnim':
      return (
        <InputTextWrapper
          borderwidth={props.borderwidth ? props.borderwidth : 'sm'}
          rounded={props.rounded ? props.rounded : 'lg'}
        >
          <input type={props.type} />
          <label>{props.label}</label>
        </InputTextWrapper>
      );

    default:
      return (
        // 일반 인풋일 경우
        // <div className={`w-full`}>
        <div className={classNames`flex flex-col capitalize mb-2`}>
          <label
            className={
              props.nolabel
                ? `sr-only`
                : classNames`mb-2 ml-1 ${props.labelcustomstyle}`
            }
          >
            {props.label}
          </label>
          <input
            className={classNames`form-input border
              ${error && touched && `border-red-500 border-4`}
              ${FIELD_SIZE_VARIANT_MAPS[props.fieldsize]}
              ${COLOR_VARIANT_MAPS[props.color]}
              ${TEXT_TRANSFORM_VARIANT_MAPS[props.texttransform]}
              ${RING_COLOR_VARIANT_MAPS[props.ringcolor]}
              ${RING_WIDTH_VARIANT_MAPS[props.ringwidth]}
              ${BGCOLOR_VARIANT_MAPS[props.bgcolor]}
              ${FONT_SIZE_VARIANT_MAPS[props.textsize]}
              ${ROUND_VARIANT_MAPS[props.rounded]}
              ${props.disabled && DISABLED_VARIANT_MAPS['text']}
              `}
            {...field}
            {...props}
            // onBlur={(e) => {
            //   console.log(e.target.value);
            //   //field.value = "test";
            // }}
            // onChange={(e) => {
            //   console.log(e.target.value);
            // }}
            onChange={(e) => {
              checkInputLength(e);
              //   setFieldValue("");
            }}
          />
          {error && touched && <ErrorDivWrapper>{error}</ErrorDivWrapper>}
        </div>
      );
  }
};

Input.defaultProps = {
  ringcolor: 'gray',
  rounded: 'lg',
  inputtype: 'normal',
  fieldsize: 'full',
  bordercolor: 'gray',
};
