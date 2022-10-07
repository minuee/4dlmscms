import React from 'react';
import { Link } from "react-router-dom";
import { LOGIN } from "sets/constants";
import logo from "imgs/logo/4DLogo.svg";
interface logoProps {
  link: string,
  className: string,
}

export const Logo: React.FC<logoProps> = ({link, className, ...props}) => {
  return (
    <Link to={LOGIN} className="-intro-x flex items-center pt-5" {...props}>
      <img alt="4DReplay" className="w-20" src={logo} />
    </Link>
  );
}