import React from 'react';
import { toast, ToastOptions, Bounce } from 'react-toastify';
import ToastUI, { ToastType } from 'comp/Alert/ToastUI';
import { AxiosResponse } from 'axios';
import { ValidationSchema } from './validationSchema';
import { getUserLocale } from 'get-user-locale';

import * as Yup from 'yup';
import { BOOL_TYPE } from '@/settings/imsStringData';
import Icons from '@/assets/images/svgs';

const toastOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: false,
  draggable: true,
  progress: undefined,
  transition: Bounce,
  rtl: false,
  closeButton: true,
  type: 'dark',
};

interface ResponseData {
  result: string;
  message: string;
  data?: any;
}

export const showNotification = (message: string, type: ToastType) => {
  toast(<ToastUI message={message} type={type} />, toastOptions);
};

export const validationSchema = (schemaName: string) => {
  return Yup.object().shape(ValidationSchema[schemaName]);
};

export const parseResponseData = (response: AxiosResponse<any>, queryName: string): ResponseData => {
  if (response && queryName) {
    if (response.data && response.data.data) {
      return response.data.data[queryName];
    }
  }
  return null;
};

// 컴포넌트 다이나믹 스타일링 시 사용하는 함수로 클래스 네임을 undefined없이 리턴해주는 함수
export const classNames = (strings, ...values) => {
  const string = values.reduce((finalString, value, index) => {
    if (!value) return finalString;
    return `${finalString}${value}${strings[index + 1]}`;
  }, strings[0]);
  return string;
};

/* Check Password Strength ----- START */
export const checkPasswordStrength = (password: string) => {
  let strengths = 0;
  if (password.length > 5) strengths++;
  if (password.length > 7) strengths++;
  if (hasNumber(password)) strengths++;
  if (hasSpecial(password)) strengths++;
  if (hasMixed(password)) strengths++;
  return strengths;
};
const hasNumber = (value) => {
  return new RegExp(/[0-9]/).test(value);
};
const hasMixed = (value) => {
  return new RegExp(/[a-z]/).test(value) && new RegExp(/[A-Z]/).test(value);
};
const hasSpecial = (value) => {
  return new RegExp(/[!#@$%^&*)(+=._-]/).test(value);
};
const strengthColor = (count) => {
  if (count < 2) return 'red';
  if (count < 3) return 'yellow';
  if (count < 4) return 'orange';
  if (count < 5) return 'lightgreen';
  if (count < 6) return 'green';
};
/* Check Password Strength ----- END */

export const currentDateTime = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  const hh = date.getUTCHours().toString().padStart(2, '0');
  const mm = date.getUTCMinutes().toString().padStart(2, '0');
  const ss = date.getUTCSeconds().toString().padStart(2, '0');
  const ms = date.getUTCMilliseconds().toString().padStart(3, '0');

  let currentDate = `${year}-${month}-${day}`;
  let currentTime = `${hh}:${mm}:${ss}.${ms}`;

  return `${currentDate} ${currentTime}`;
};

export const getFutureDate = (months: number) => {
  let currentDate = new Date();
  currentDate.setMonth(currentDate.getMonth() + months);

  return currentDate.toISOString();
};

export const getLocaleInfo = () => {
  let language = getUserLocale();
  if (language === 'ko' || language === 'ko-KR') {
    return (language = 'ko-KR');
  }
  if (language === 'en' || language === 'en-US') {
    return (language = 'en-US');
  }
  if (language === 'ja' || language === 'ja-JP') {
    return (language = 'ja-JP');
  }
  language = 'en-US';
  return language;
};

export type ResponseDataType = ReturnType<typeof parseResponseData>;

// boolean값을 smallInt로 바꾸는 메서드
export const changeToSmallInt = (param: boolean): number => {
  const smallInt = param === true ? 1 : 0;
  return smallInt;
};
// smallInt값을 boolean값으로 바꾸는 메서드
export const changeSmallIntToBoolean = (param: number): boolean => {
  const bool = param === 1 ? true : false;
  return bool;
};

// string Y, N값을 boolean값으로 바꾸는 메서드
export const changeStringIntoBoolean = (param: string): boolean => {
  const bool = param.toLowerCase() === 'y' ? true : false;
  return bool;
};

// boolean값이면 그대로 내보내고 아니면 불린으로 바꿔주는 메서드
export const returnBoolean = (param: boolean | string): boolean => {
  if (typeof param === 'boolean') return param;
  const bool = param === 'Y' ? true : false;
  return bool;
};

// boolean값을 IMS에서 사용하는 스트링 값으로 리턴하는 메서드
export const returnImsBoolString = (p: boolean): string => {
  const strTrue = BOOL_TYPE.list.find((item) => item.name === true).code;
  const strFalse = BOOL_TYPE.list.find((item) => item.name === false).code;
  const str = p === true ? strTrue : strFalse;
  return str;
};

// 숫자 데이터값을 데이트 스트링 형태로 바꿔주는 메서드
export const convertNumToDateString = (timeNum: number): string => {
  const stringDate = new Date(timeNum * 1000).toISOString().substring(0, 16);
  return stringDate;
};

// 숫자를 date-local 인풋값으로 바꾸는 메서드
export const convertNumberToDatetimeForInput = (num: number): string => {
  const convertedTime = new Date(+num * 1000).toISOString().substring(0, 16);
  return convertedTime;
};

// 데이트 값을 숫자로 바꿔주는 메서드
export const convertTimeToNumber = (date: Date): number => {
  const theDate = new Date(date);
  const offset = new Date().getTimezoneOffset() * 1000 * 60;
  const numDate = Math.floor(theDate.getTime()) - offset;
  return numDate;
};

export const getLocalDate = (value: number) => {
  const convertedValue = new Date(value);
  const offsetDate = new Date(convertedValue).valueOf();
  const date = new Date(offsetDate).toISOString();
  return date.substring(0, 16);
};

// formik initial data를 위한 값, 현재(now)의 값을 원하는 형식의 데이터로 변환한다.
export const getLocalDateFromDate = (value: Date) => {
  const convertedValue = new Date();
  const offsetDate = new Date(convertedValue).valueOf();
  const date = new Date(offsetDate).toISOString();
  return date.substring(0, 16);
};

// 화면에 보여주는 형식의 데이트 스트링으로 바꿔주는 메서드
// 예) 	2021-08-02 01:43:00
export const convertDateToUIString = (data) => {
  const convertedTime = new Date(data * 1000)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');
  return convertedTime;
};

// 인풋 필드 클릭 시 해당 인풋의 포믹 에러를 없애주는 메서드
export const resetError = (e, formik) => {
  const name = e.target.name;
  formik.setErrors({ ...formik.errors, [name]: '' });
};

// json으로 변환할 수 있는지 확인하기 위한 메서드
export const IsJsonString = (str: string): boolean => {
  try {
    const json = JSON.parse(str);
    return typeof json === 'object';
  } catch (e) {
    return false;
  }
};

//
export const returnNe = (param: string): string => {
  const result = param ? param : 'ne';
  return result;
};
export const excludeNe = (param: string): string => {
  const result = param === 'ne' ? '' : param;
  return result;
};

export const returnTernary = (param: any): any => {
  const result = param ? param : '';
  return result;
};

export const trimAllData = (param: any): any => {
  for (const elem in param) {
    if (typeof param[elem] !== 'string') continue;
    param[elem] = param[elem].trim();
  }
  return param;
};

export const trimAllWhitespace = (param: string): string => {
  return param.replaceAll(' ', '');
};

// 검색을 위한 기능
export const ch2pattern = (ch: string) => {
  const offset = 44032; /* '가'의 코드 */
  // 한국어 음절
  if (/[가-힣]/.test(ch)) {
    const chCode = ch.charCodeAt(0) - offset;
    // 종성이 있으면 문자 그대로를 찾는다.
    if (chCode % 28 > 0) {
      return ch;
    }
    const begin = Math.floor(chCode / 28) * 28 + offset;
    const end = begin + 27;
    return `[\\u${begin.toString(16)}-\\u${end.toString(16)}]`;
  }
  // 한글 자음
  if (/[ㄱ-ㅎ]/.test(ch)) {
    const con2syl: any = {
      ㄱ: '가'.charCodeAt(0),
      ㄲ: '까'.charCodeAt(0),
      ㄴ: '나'.charCodeAt(0),
      ㄷ: '다'.charCodeAt(0),
      ㄸ: '따'.charCodeAt(0),
      ㄹ: '라'.charCodeAt(0),
      ㅁ: '마'.charCodeAt(0),
      ㅂ: '바'.charCodeAt(0),
      ㅃ: '빠'.charCodeAt(0),
      ㅅ: '사'.charCodeAt(0),
    };
    const begin = con2syl[ch] || (ch.charCodeAt(0) - 12613) /* 'ㅅ'의 코드 */ * 588 + con2syl['ㅅ'];
    const end = begin + 587;
    return `[${ch}\\u${begin.toString(16)}-\\u${end.toString(16)}]`;
  }
  // 그 외엔 그대로 내보냄
  // escapeRegExp는 lodash에서 가져옴
  import('lodash').then((module) => {
    const { escapeRegExp } = module;
    return escapeRegExp(ch);
  });
};

export const createFuzzyMatcher = (input: any) => {
  const pattern = input.split('').map(ch2pattern).join('.*?');
  return new RegExp(pattern);
};

type IconType = {
  icon: keyof typeof Icons;
  className?: string;
  dataTip?: string;
};
// 아이콘을 리턴하는 메서드
export const returnIcon = (props: IconType) => {
  const { icon, ...rest } = props;
  const Component = Icons[icon];

  return <Component {...rest} />;
};

export const getFileExtension = (file: string) => {
  const fileDot = file.lastIndexOf('.');
  return file.substring(fileDot + 1, file.length).toLowerCase();
}

export const getHlsBaseUrl = (fileUrl: string, isHttps: boolean) => {
  
  let fetchUrl = '';

  if(isHttps) {
    if(fileUrl.indexOf('https://') > -1) {

    } else {

    }
  } else {
    if(fileUrl.indexOf('https://') > -1) {
      fetchUrl = fileUrl.replace('https://', 'http://')
    } 
  }

  const pathSep = fileUrl.lastIndexOf('/');
  return fileUrl.substring(0, pathSep - 3);
}

export const getCacheBuster = () => { 
  return ('?' + new Date().getTime()); 
}
