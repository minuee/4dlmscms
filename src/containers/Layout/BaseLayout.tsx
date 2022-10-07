import React, { useContext } from "react";
import { Redirect } from "react-router-dom";
import { AuthContext } from "cont/auth";
import UseBodyClass from "comp/Common/UseBodyClass";

import MobileMenu from "./MobileMenu";
import Topbar from "./Topbar";
import SideMenu from "./SideMenu";
import Content from "./Content";

import { LOGIN } from "sets/constants";

interface LayoutProps {}

const BaseLayout: React.FC<LayoutProps> = ({ children }) => {  
  const { isAuthenticated } = useContext(AuthContext);
  if (!isAuthenticated) return <Redirect to={{ pathname: LOGIN }} />;
  UseBodyClass("main");

  return (
    <>
      <MobileMenu />
      <Topbar />
      <div className="wrapper">
        <div className="wrapper-box">
          <SideMenu />
          <Content>{children}</Content>
        </div>
      </div>
    </>
  );
};

export default BaseLayout;