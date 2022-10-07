import React from 'react';
import { classNames } from '@/utils/commonFn';
import { ROUND_VARIANT_MAPS } from '@/assets/styles/helpers/tailwindCommon';

type BageColors =
  | 'badge-success'
  | 'badge-superSuccess'
  | 'badge-warning'
  | 'badge-danger';

interface BadgeProps {
  rounded?: rounded;
  status?: BageColors;
  label?: string;
}

const Badge: React.FC<BadgeProps & WithChildren> = (
  props: BadgeProps & WithChildren
) => {
  return (
    <span
      className={classNames`badge 
        ${props.rounded ? ROUND_VARIANT_MAPS[props.rounded] : `rounded`} 
        ${props.status}
        `}
    >
      {props.children ? props.children : props.label}
    </span>
  );
};
export default Badge;

//  badge-${props.status}`
