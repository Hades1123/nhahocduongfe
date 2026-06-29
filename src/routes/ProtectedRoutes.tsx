import Layout from "@/components/Layout";
import { slugs } from "@/constants/slugs";
import Dashboard from "@/pages/Dashboard";
import DentalRecordForm from "@/pages/DentalRecord/components/DentalRecordForm";
import DentalRecord from "@/pages/DentalRecord/routes";
import Logout from "@/pages/Logout";
import ManagementList from "@/pages/Management/routes/ManagementList";
import UserManagementList from "@/pages/Management/routes/UserManagementList";
import AccountRegistrationList from "@/pages/Management/routes/AccountRegistrationList";
import LoginLogsList from "@/pages/Management/routes/LoginLogsList";
import HealthCheckModal from "@/pages/Patient/components/healthCheckHistoryModalForm";
import {
  PatientCreate,
  PatientDetail,
  PatientList,
} from "@/pages/Patient/routes";
import Superset_BC1 from "@/pages/Superset_BC1";

import { Navigate, Outlet, useRoutes } from "react-router-dom";
import jwt_decode from "jwt-decode";
import DentalArticles from "@/pages/DentalArticles";
import {
  ExamCampaignList,
  ExamScheduleManager,
} from "@/pages/ExamCampaign/routes";

const ProtectedRoutes = (): React.ReactElement<
  any,
  string | React.JSXElementConstructor<any>
> | null => {
  const token = localStorage.getItem("accessToken");
  let isGuest = false;
  if (token) {
    try {
      const decoded: any = jwt_decode(token);
      const roles = decoded?.roles || [];
      isGuest = roles.some((r: any) => r.code === "GUEST");
    } catch (e) {
      console.error(e);
    }
  }

  const guestRoutes = [
    {
      element: <Layout />,
      children: [
        {
          path: slugs.dentalArticles,
          element: <DentalArticles />,
        },
        {
          path: slugs.logout,
          element: <Logout />,
        },
        {
          path: "*",
          element: <Navigate to={slugs.dentalArticles} />,
        },
      ],
    },
  ];

  const normalRoutes = [
    {
      element: <Layout />,
      children: [
        {
          path: slugs.logout,
          element: <Logout />,
        },
        {
          path: slugs.dentalArticles,
          element: <DentalArticles />,
        },
        // {
        //   path: slugs.home,
        //   element: <Dashboard />,
        // },
        {
          path: slugs.report1,
          element: <Superset_BC1 />,
        },
        {
          path: slugs.examCampaign,
          element: <Outlet />,
          children: [
            {
              path: "",
              element: <ExamCampaignList />,
            },
            {
              path: slugs.examSchedule,
              element: <ExamScheduleManager />,
            },
          ],
        },
        {
          path: slugs.patients,
          element: <Outlet />,
          children: [
            {
              path: "",
              element: <PatientList />,
            },
            {
              path: slugs.patientCreate,
              element: <PatientCreate />,
            },
            {
              path: slugs.healthCheckHistory,
              element: <HealthCheckModal />,
            },

            {
              path: slugs.patientDetail,
              element: <PatientDetail />,
            },
          ],
        },
        {
          path: slugs.dentalRecord,
          element: <Outlet />,
          children: [
            {
              path: "",
              element: <DentalRecord />,
            },
            {
              path: slugs.dentalRecordCreate,
              element: <DentalRecordForm />,
            },
          ],
          // element: <DentalRecord />,
        },
        {
          path: slugs.management,
          element: <Outlet />,
          children: [
            {
              path: "",
              element: <ManagementList />,
            },
          ],
        },
        {
          path: slugs.managementUser,
          element: <Outlet />,
          children: [
            {
              path: "",
              element: <UserManagementList />,
            },
          ],
        },
        {
          path: slugs.accountRegistration,
          element: <Outlet />,
          children: [
            {
              path: "",
              element: <AccountRegistrationList />,
            },
          ],
        },
        {
          path: slugs.loginLogs,
          element: <Outlet />,
          children: [
            {
              path: "",
              element: <LoginLogsList />,
            },
          ],
        },
        {
          path: "*",
          element: <Navigate to="/patient" />,
          // element: <Navigate to="/" />,
        },
      ],
    },
  ];

  const element = useRoutes(isGuest ? guestRoutes : normalRoutes);
  return element;
};

export { ProtectedRoutes };
