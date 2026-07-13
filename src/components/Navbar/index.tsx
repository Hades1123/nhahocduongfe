import logo from "@/assets/logo/logo.png";
import { navMenuGroups } from "@/constants/defines";
import { slugs } from "@/constants/slugs";
import { NavMenuGroup, Role } from "@/constants/type";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import {
  Bars3Icon,
  BellIcon,
  ChevronDownIcon,
  XMarkIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { Fragment, useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import Modal from "@/components/Modal";
import ChangePasswordForm from "@/pages/Login/ChangePassWord";
import jwt_decode from "jwt-decode";
import {
  notificationApi,
  NotificationItem,
} from "@/api/notificationApi";
import ThemeConfig from "@/components/ThemeConfig";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Reusable NavDropdown – renders a single top-level dropdown for desktop
// ---------------------------------------------------------------------------
function NavDropdown({
  group,
  isAdmin,
  pathname,
}: {
  group: NavMenuGroup;
  isAdmin: boolean;
  pathname: string;
}) {
  const visibleChildren = group.children.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  if (visibleChildren.length === 0) return null;

  // Highlight the parent when any child route is active
  const isActive = visibleChildren.some((item) => pathname === item.slug);

  return (
    <div className="group relative">
      <button
        className={twMerge(
          "inline-flex items-center gap-1 border-b-2 border-transparent px-2 pt-1 text-sm",
          "font-medium text-white hover:border-gray-300 hover:text-gray-50",
          "focus:outline-none transition-colors duration-150",
          isActive && "border-white font-semibold",
        )}
      >
        {group.label}
        <ChevronDownIcon
          className={twMerge(
            "h-4 w-4 transition-transform duration-200 group-hover:rotate-180",
          )}
        />
      </button>

      {/* Invisible bridge to prevent hover loss between button and menu */}
      <div className="absolute left-0 top-full h-4 w-full bg-transparent"></div>

      <div className="absolute left-0 top-full z-50 mt-1 hidden w-56 origin-top-left flex-col overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/5 transition-all duration-200 group-hover:flex">
        <div className="py-2">
          {visibleChildren.map((item) => {
            const isChildActive = pathname === item.slug;
            return (
              <Link
                key={item.id}
                to={item.slug}
                className={classNames(
                  isChildActive
                    ? "bg-gray-50 font-semibold !text-gray-900"
                    : "font-medium !text-gray-600 hover:bg-gray-50 hover:!text-gray-900",
                  "block px-4 py-2.5 text-sm transition-colors duration-150",
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable MobileNavGroup – renders a collapsible group inside the mobile menu
// ---------------------------------------------------------------------------
function MobileNavGroup({
  group,
  isAdmin,
  pathname,
  closeMobileMenu,
}: {
  group: NavMenuGroup;
  isAdmin: boolean;
  pathname: string;
  closeMobileMenu: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const visibleChildren = group.children.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  if (visibleChildren.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={twMerge(
          "flex w-full items-center justify-between border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-white hover:bg-indigo-500",
          expanded && "bg-indigo-700",
        )}
      >
        {group.label}
        <ChevronDownIcon
          className={twMerge(
            "h-4 w-4 text-white transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && (
        <div className="bg-indigo-700/50">
          {visibleChildren.map((item) => (
            <Link
              key={item.id}
              to={item.slug}
              onClick={closeMobileMenu}
              className={twMerge(
                "block border-l-4 py-2 pl-6 pr-4 text-sm font-medium",
                pathname === item.slug
                  ? "border-white bg-white font-semibold text-indigo-600 dark:border-slate-800 dark:bg-slate-800 dark:text-indigo-400"
                  : "border-transparent text-white hover:bg-indigo-500 hover:text-gray-50",
              )}
            >
              {item.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Navbar component
// ---------------------------------------------------------------------------
export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpenUpdatePassword, setIsOpenUpdatePassword] = useState(false);
  // ── Theme config drawer state ──
  // Controls the visibility of the sliding ThemeConfig panel
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  const token = localStorage.getItem("accessToken");
  let isGuest = false;
  let isAdmin = false;
  let isDentist = false;
  let role: Role = "GUEST";
  if (token) {
    try {
      const decoded: any = jwt_decode(token);
      const roles = decoded?.roles || [];
      isGuest = roles.some((r: any) => r.code === "GUEST");
      isAdmin = roles.some((r: any) => r.code === "ADMIN");
      isDentist = roles.some((r: any) => r.code === "DENTIST");
      role = isAdmin ? "ADMIN" : isDentist ? "DENTIST" : "GUEST";
    } catch (e) {
      console.error(e);
    }
  }

  // ---- Notification state ----
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (isGuest) return;
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (e) {
      // silent fail - bell icon just shows no badge
    }
  }, [isGuest]);

  const fetchNotifications = async () => {
    if (isGuest) return;
    setLoadingNotifications(true);
    try {
      const data = await notificationApi.getMyNotifications();
      setNotifications(data);
    } catch (e) {
      // silent fail
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      // silent fail
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      // silent fail
    }
  };

  // Poll unread count every 30s
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);



  return (
    <>
      <Modal
        isOpen={isOpenUpdatePassword}
        setIsOpen={setIsOpenUpdatePassword}
        onClose={() => console.log("close")}
        title={"Đổi mật khẩu"}
        width={500}
      >
        <ChangePasswordForm
          onSuccess={() => {
            setIsOpenUpdatePassword(false);
          }}
        />
      </Modal>
      {/* Theme configuration drawer — mounts at root DOM level */}
      <ThemeConfig isOpen={isThemeOpen} onClose={() => setIsThemeOpen(false)} />
      {/* theme-navbar-bg: hook class for custom palette navbar background.
           Default: bg-indigo-600 wins. Custom theme active: var(--theme-primary). */}
      <Disclosure as="nav" className="sticky top-0 z-50 bg-indigo-600 dark:bg-slate-900 shadow theme-navbar-bg">
        {({ open, close }) => (
          <>
            <div className="w-full px-2 sm:px-6 lg:px-8">
              <div className="relative flex h-16 items-center justify-between">
                {/* ======= Group 1: Left-aligned (hamburger + logo + title + dropdowns) ======= */}
                <div className="flex items-center">
                  {/* Mobile hamburger */}
                  <div className="flex items-center sm:hidden">
                    <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                      <span className="sr-only">Open main menu</span>
                      {open ? (
                        <XMarkIcon
                          className="block h-6 w-6"
                          aria-hidden="true"
                        />
                      ) : (
                        <Bars3Icon
                          className="block h-6 w-6"
                          aria-hidden="true"
                        />
                      )}
                    </Disclosure.Button>
                  </div>

                  {/* Logo + Title */}
                  <Link
                    to={slugs.home}
                    className="flex flex-shrink-0 items-center gap-4 font-bold uppercase text-white"
                  >
                    <img
                      className="block h-8 w-auto lg:hidden"
                      src={logo}
                      alt="logo"
                    />
                    <img
                      className="hidden h-8 w-auto lg:block"
                      src={logo}
                      alt="logo"
                    />
                    <span className="hidden sm:block">
                      Hệ thống quản lý nha học đường
                    </span>
                    <span className="sm:hidden">Nha học đường</span>
                  </Link>

                  {/* ---- Desktop navigation dropdowns ---- */}
                  <div className="menuBar ml-6 hidden sm:flex sm:items-center sm:gap-6">
                    {(
                      // Authenticated: show grouped dropdowns
                      navMenuGroups.filter((group) => group.role.includes(role)).map((group) => (
                        <NavDropdown
                          key={group.id}
                          group={group}
                          isAdmin={isAdmin}
                          pathname={location.pathname}
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* ======= Group 2: Right-aligned (bell + profile) ======= */}
                <div className="flex flex-shrink-0 items-center gap-2">
                  {/* Notification bell with dropdown */}
                  {!isGuest && (
                    <Menu as="div" className="relative">
                      <Menu.Button
                        className="relative rounded-full bg-white dark:bg-slate-800 p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        onClick={fetchNotifications}
                      >
                        <span className="sr-only">View notifications</span>
                        <BellIcon className="h-6 w-6" aria-hidden="true" />
                        {unreadCount > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </Menu.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-md bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="border-b px-4 py-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                                Thông báo
                              </h3>
                              {unreadCount > 0 && (
                                <button
                                  onClick={handleMarkAllAsRead}
                                  className="text-xs text-indigo-600 hover:text-indigo-300 dark:text-sky-300 dark:hover:text-sky-500"
                                >
                                  Đánh dấu tất cả đã đọc
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="max-h-80 overflow-y-auto">
                            {loadingNotifications ? (
                              <div className="px-4 py-6 text-center text-sm text-gray-500">
                                Đang tải...
                              </div>
                            ) : notifications.length === 0 ? (
                              <div className="px-4 py-6 text-center text-sm text-gray-500">
                                Không có thông báo nào
                              </div>
                            ) : (
                              notifications.slice(0, 10).map((notification) => (
                                <Menu.Item key={notification.id}>
                                  {({ active }) => (
                                    <div
                                      className={`cursor-pointer border-b px-4 py-3 text-sm ${active ? "bg-gray-50 dark:bg-slate-700" : ""
                                        } ${!notification.isRead ? "bg-indigo-50/50 dark:bg-indigo-900/40" : ""}`}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                          <p
                                            className={`truncate text-sm ${!notification.isRead
                                              ? "font-semibold text-gray-900 dark:text-slate-100"
                                              : "text-gray-700 dark:text-slate-400"
                                              }`}
                                          >
                                            {notification.title}
                                          </p>
                                          <p className={`mt-1 line-clamp-2 whitespace-pre-line text-xs ${!notification.isRead ? "text-gray-600 dark:text-slate-300" : "text-gray-500 dark:text-slate-500"
                                            }`}>
                                            {notification.message}
                                          </p>
                                          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                                            {new Date(
                                              notification.createdDate,
                                            ).toLocaleString("vi-VN")}
                                          </p>
                                        </div>
                                        {!notification.isRead && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleMarkAsRead(notification.id);
                                            }}
                                            className="flex-shrink-0 text-xs text-indigo-600 hover:text-indigo-300 dark:text-sky-300 dark:hover:text-sky-500"
                                          >
                                            Đã đọc
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </Menu.Item>
                              ))
                            )}
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  )}

                  {/* Guest users still see a plain bell (no dropdown) */}
                  {isGuest && (
                    <button
                      type="button"
                      className="rounded-full bg-white dark:bg-slate-800 p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      <span className="sr-only">View notifications</span>
                      <BellIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  )}

                  {/* ── Theme Configuration button ── */}
                  {/* Sits between the bell and the profile menu */}
                  <button
                    type="button"
                    onClick={() => setIsThemeOpen(!isThemeOpen)}
                    className={`rounded-full bg-white dark:bg-slate-800 p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors ${isThemeOpen ? "!text-indigo-600 dark:!text-indigo-400" : ""}`}
                    title="Cài đặt giao diện"
                    aria-label="Mở cài đặt giao diện"
                  >
                    <Cog6ToothIcon className={`h-6 w-6 transition-transform duration-500 ${isThemeOpen ? "rotate-90" : ""}`} aria-hidden="true" />
                  </button>

                  {/* Profile dropdown */}
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className="flex rounded-full text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                        <span className="">
                          {localStorage.getItem("username") || "VTS-TTGPMN"}
                        </span>
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-slate-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {localStorage.getItem("username") != "guest" && (
                          <Menu.Item>
                            {({ active }) => (
                              <>
                                <p
                                  className={classNames(
                                    active ? "bg-gray-100 dark:bg-slate-700/50" : "",
                                    "block cursor-pointer px-4 py-2 text-sm text-gray-700 dark:text-slate-200",
                                  )}
                                  onClick={() => setIsOpenUpdatePassword(true)}
                                >
                                  Đổi mật khẩu
                                </p>
                              </>
                            )}
                          </Menu.Item>
                        )}
                        <Menu.Item>
                          {({ active }) => (
                            <p
                              // href="#"
                              onClick={() => navigate("/logout")}
                              className={classNames(
                                active ? "bg-gray-100 dark:bg-slate-700/50" : "",
                                "block cursor-pointer px-4 py-2 text-sm text-gray-700 dark:text-slate-200",
                              )}
                            >
                              Đăng xuất
                            </p>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </div>
            </div>

            {/* ---- Mobile navigation ---- */}
            <Disclosure.Panel className="sm:hidden">
              <div className="space-y-1 pb-4 pt-2">
                {(
                  // Authenticated: show grouped collapsible sections
                  navMenuGroups.map((group) => (
                    <MobileNavGroup
                      key={group.id}
                      group={group}
                      isAdmin={isAdmin}
                      pathname={location.pathname}
                      closeMobileMenu={() => close()}
                    />
                  ))
                )}
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </>
  );
}
