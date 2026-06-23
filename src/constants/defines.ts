import { slugs } from "./slugs";
import { NavMenuItem } from "./type";
import { v4 as uuidv4 } from "uuid";

export const navMenuItems: NavMenuItem[] = [
  {
    id: uuidv4(),
    title: "Học sinh",
    slug: slugs.patients,
  },
  // {
  //   id: uuidv4(),
  //   title: "Bệnh án",
  //   slug: slugs.dentalRecord,
  // },
  {
    id: uuidv4(),
    title: "Quản trị",
    slug: slugs.management,
  },
  {
    id: uuidv4(),
    title: "Duyệt tài khoản",
    slug: slugs.accountRegistration,
  },
  {
    id: uuidv4(),
    title: "Nhật ký đăng nhập",
    slug: slugs.loginLogs,
  },
  {
    id: uuidv4(),
    title: "Quản lý người dùng",
    slug: slugs.managementUser,
  },
  // {
  //   id: uuidv4(),
  //   title: "Báo cáo",
  //   slug: slugs.report1,
  // },
];

export const reportsMenu: NavMenuItem[] = [
  {
    id: uuidv4(),
    title: "Báo cáo kết quả khám răng miệng",
    slug: slugs.report1,
  },
  {
    id: uuidv4(),
    title: "Báo cáo Tổng số học sinh bị sâu răng theo khối",
    slug: "/",
  },
  {
    id: uuidv4(),
    title: "Báo cáo Tổng số răng vĩnh viễn bị sâu",
    slug: "/",
  },
  {
    id: uuidv4(),
    title: "Báo cáo Tổng số răng sữa bị sâu",
    slug: "/",
  },
  {
    id: uuidv4(),
    title: "Báo cáo Tổng số Học sinh trám răng, số răng được trám",
    slug: "/",
  },
  {
    id: uuidv4(),
    title:
      "Báo cáo Tổng số học sinh có trám bít hố rãnh, số răng được trám bít",
    slug: "/",
  },
];
