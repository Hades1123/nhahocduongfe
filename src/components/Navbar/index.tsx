import logo from "@/assets/logo/logo.png";
import { navMenuGroups, navMenuItems } from "@/constants/defines";
import { slugs } from "@/constants/slugs";
import { NavMenuGroup } from "@/constants/type";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import {
  Bars3Icon,
  BellIcon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Fragment, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import Modal from "@/components/Modal";
import ChangePasswordForm from "@/pages/Login/ChangePassWord";
import jwt_decode from "jwt-decode";

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
    <Menu as="div" className="relative">
      {({ open }) => (
        <>
          <Menu.Button
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
                "h-4 w-4 transition-transform duration-200",
                open && "rotate-180",
              )}
            />
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
            <Menu.Items className="absolute left-0 z-50 mt-2 w-52 origin-top-left rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              {visibleChildren.map((item) => (
                <Menu.Item key={item.id}>
                  {({ active }) => (
                    <Link
                      to={item.slug}
                      className={classNames(
                        active ? "bg-indigo-50" : "",
                        pathname === item.slug
                          ? "bg-indigo-100 font-semibold text-indigo-700"
                          : "text-gray-700",
                        "block px-4 py-2 text-sm",
                      )}
                    >
                      {item.title}
                    </Link>
                  )}
                </Menu.Item>
              ))}
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
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
                  ? "border-white bg-white font-semibold text-indigo-600"
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

  const token = localStorage.getItem("accessToken");
  let isGuest = false;
  let isAdmin = false;
  if (token) {
    try {
      const decoded: any = jwt_decode(token);
      const roles = decoded?.roles || [];
      isGuest = roles.some((r: any) => r.code === "GUEST");
      isAdmin = roles.some((r: any) => r.code === "ADMIN");
    } catch (e) {
      console.error(e);
    }
  }

  // Guest users only see the flat "Bài viết khoa học" link
  const guestItems = navMenuItems.filter(
    (item) => item.slug === slugs.dentalArticles,
  );

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
      <Disclosure as="nav" className="sticky top-0 z-50 bg-indigo-600 shadow">
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
                        <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                      ) : (
                        <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
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
                    {isGuest ? (
                      // Guest: show flat link(s) only
                      guestItems.map((item) => (
                        <Link
                          to={item.slug}
                          key={item.id}
                          className={twMerge(
                            "inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm",
                            "font-medium text-white hover:border-gray-300 hover:text-gray-50",
                            location.pathname === item.slug &&
                              "border-white font-semibold",
                          )}
                        >
                          {item.title}
                        </Link>
                      ))
                    ) : (
                      // Authenticated: show grouped dropdowns
                      navMenuGroups.map((group) => (
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
                  <button
                    type="button"
                    className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <span className="sr-only">View notifications</span>
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
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
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {localStorage.getItem("username") != "guest" && (
                          <Menu.Item>
                            {({ active }) => (
                              <>
                                <p
                                  className={classNames(
                                    active ? "bg-gray-100" : "",
                                    "block cursor-pointer px-4 py-2 text-sm text-gray-700",
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
                                active ? "bg-gray-100" : "",
                                "block cursor-pointer px-4 py-2 text-sm text-gray-700",
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
                {isGuest ? (
                  // Guest: show flat link(s) only
                  guestItems.map((item) => (
                    <Disclosure.Button
                      key={item.id}
                      as={Link}
                      to={item.slug}
                      onClick={() => close()}
                      className={twMerge(
                        "block border-l-4 py-2 pl-3 pr-4 text-base font-medium",
                        location.pathname === item.slug
                          ? "border-white bg-white font-semibold text-indigo-600"
                          : "border-transparent text-white hover:bg-indigo-500 hover:text-gray-50",
                      )}
                    >
                      {item.title}
                    </Disclosure.Button>
                  ))
                ) : (
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
