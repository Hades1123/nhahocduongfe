import { slugs } from "@/constants/slugs";
import Login from "@/pages/Login";
import Logout from "@/pages/Logout";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import React from "react";
import { Navigate, useRoutes } from "react-router-dom";

interface IPublicRoutes {
  setAuth?: React.Dispatch<React.SetStateAction<boolean>>;
}
const PublicRoutes = ({
  setAuth,
}: IPublicRoutes): React.ReactElement<
  any,
  string | React.JSXElementConstructor<any>
> | null => {
  const element = useRoutes([
    {
      path: slugs.login,
      element: <Login />,
    },
    {
      path: slugs.signup,
      element: <Signup />,
    },
    {
      path: slugs.logout,
      element: <Logout />,
    },
    {
      path: slugs.forgotPassword,
      element: <ForgotPassword />,
    },
    {
      path: "*",
      element: <Navigate to={slugs.login} />,
    },
  ]);
  return element;
};

export { PublicRoutes };
