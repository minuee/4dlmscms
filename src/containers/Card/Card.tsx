import React, { ReactChild, ReactChildren, ReactNode } from 'react'
import { classNames } from '@/utils/commonFn'

const CardHeader = ({ headerTitle, children, headerTypes }) => {
  return (
    <div
      className={classNames`p-5 flex items-center border-b border-gray-200 dark:border-dark-5 ${
        headerTypes === 'tabs'
          ? `sm:py-0`
          : headerTypes === 'button'
          ? `sm:py-3`
          : ``
      }`}
    >
      <h2 className='capitalize font-medium text-base mr-auto'>
        {headerTitle}
      </h2>
      {children}
    </div>
  )
}

// type HeaderHeight = 'tabs' | 'button' | null
interface CardProps {
  cardWidth?: 'full' | 'half'
  headerTitle: string
  headerChildren?: ReactNode | ReactChild | ReactChildren
  headerTypes?: 'tabs' | 'button' | null
}

const Card: React.FC<CardProps> = (props: CardProps & WithChildren) => {
  return (
    <article
      className={`intro-y box col-span-12  ${
        props.cardWidth === 'full' ? `lg:col-span-12` : `lg:col-span-6`
      }`}
    >
      <CardHeader
        headerTitle={props.headerTitle}
        headerTypes={props.headerTypes}
      >
        {props.headerChildren}
      </CardHeader>
      <div className='p-5'>{props.children}</div>
    </article>
  )
}
export default Card
