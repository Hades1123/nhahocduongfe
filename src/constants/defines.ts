import { slugs } from "./slugs";
import { NavMenuGroup, NavMenuItem } from "./type";
import { v4 as uuidv4 } from "uuid";

export const navMenuGroups: NavMenuGroup[] = [
  {
    id: uuidv4(),
    label: "Học Sinh",
    children: [
      {
        id: uuidv4(),
        title: "Danh sách",
        slug: slugs.patients,
      },
    ],
  },
  {
    id: uuidv4(),
    label: "Bác Sĩ",
    children: [
      {
        id: uuidv4(),
        title: "Đợt khám",
        slug: slugs.examCampaign,
      },
      {
        id: uuidv4(),
        title: "Theo dõi khám",
        slug: slugs.examCampaign + "/tracking",
      },
      {
        id: uuidv4(),
        title: "Lịch tái khám",
        slug: slugs.examCampaign + "/re-exams",
      },
    ],
  },
  {
    id: uuidv4(),
    label: "Quản trị",
    children: [
      {
        id: uuidv4(),
        title: "Trường học",
        slug: slugs.management,
      },
      {
        id: uuidv4(),
        title: "Duyệt tài khoản",
        slug: slugs.accountRegistration,
        adminOnly: true,
      },
      {
        id: uuidv4(),
        title: "Nhật ký đăng nhập",
        slug: slugs.loginLogs,
        adminOnly: true,
      },
      {
        id: uuidv4(),
        title: "Quản lý người dùng",
        slug: slugs.managementUser,
        adminOnly: true,
      },
    ],
  },
];

// Flat list kept for backward compatibility (e.g., guest "Bài viết khoa học" link)
export const navMenuItems: NavMenuItem[] = [
  {
    id: uuidv4(),
    title: "Bài viết khoa học",
    slug: slugs.dentalArticles,
  },
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
