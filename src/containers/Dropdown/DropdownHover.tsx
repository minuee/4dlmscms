import React, { ReactChild, ReactNode, ReactChildren } from 'react'
import styled from 'styled-components'
import { classNames } from '@/utils/commonFn'

export const DropdownDepthedList = styled.li.attrs({
  className: 'rounded-sm relative px-3 py-1 hover:bg-gray-100',
})`
  & > ul {
    transform: translateX(100%) scale(0);
  }
  &:hover > ul {
    transform: translateX(101%) scale(1);
  }
  & > button svg {
    transform: rotate(-90deg);
  }
  &:hover > button svg {
    transform: rotate(-270deg);
  }
`

interface DropdownListProps {
  label?: string | ReactNode | ReactChild | ReactChildren
  underline?: boolean
}

export const DropdownList: React.FC<DropdownListProps & WithChildren> = (
  props: DropdownListProps & WithChildren
) => {
  return (
    <li className='whitespace-pre cursor-pointer px-6 py-4 hover:bg-dark-5'>
      {props.label ? props.label : props.children}
    </li>
  )
}

interface DropDownProps {
  label?: ReactNode | string
  align?: 'right' | 'left'
}

const DropDownHover: React.FC<DropDownProps & WithChildren> = (
  props: DropDownProps & WithChildren
) => {
  return (
    <div className='group relative inline-block'>
      <button className='pl-3 outline-none focus:outline-none flex items-center'>
        <span className='font-semibold flex-1'>{props.label}</span>
      </button>
      <ul
        className={classNames`${
          props.align === 'right' ? ` right-0` : ` left-0`
        }  absolute mt-2 bg-dark-6 text-white border rounded-md transform scale-0 group-hover:scale-100 transition duration-150 ease-in-out origin-top min-w-32`}
      >
        {props.children}
      </ul>
    </div>
  )
}
export default DropDownHover
