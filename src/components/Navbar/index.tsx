import logo from "@/assets/logo/logo.png";
import { navMenuItems } from "@/constants/defines";
import { slugs } from "@/constants/slugs";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Fragment, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import Modal from "@/components/Modal";
import ChangePasswordForm from "@/pages/Login/ChangePassWord";
import jwt_decode from "jwt-decode";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

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

  const filteredMenuItems = navMenuItems.filter((item) => {
    if (isGuest) {
      return item.slug === slugs.dentalArticles;
    }
    if (item.slug === slugs.dentalArticles) {
      return false;
    }
    if (
      item.slug === slugs.accountRegistration ||
      item.slug === slugs.loginLogs ||
      item.slug === slugs.managementUser
    ) {
      return isAdmin;
    }
    return true;
  });

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
              <div className="relative flex h-16 justify-between">
                <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                  {/* Mobile menu button */}
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
                <div className="menuBar flex flex-1 items-center justify-center text-white sm:items-stretch">
                  <Link
                    to={slugs.home}
                    className="flex flex-shrink-0 items-center gap-4 font-bold uppercase"
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
                  <div className="menuBar hidden sm:flex sm:flex-1 sm:items-center sm:justify-evenly sm:gap-2">
                    {filteredMenuItems.map((item) => (
                      <Link
                        to={item.slug}
                        key={item.id}
                        className={twMerge(
                          "inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm",
                          "font-medium text-white hover:border-gray-300 hover:text-gray-50",
                          location.pathname === item.slug &&
                            "border-white font-semibold ",
                        )}
                      >
                        {item.title}
                      </Link>
                    ))}

                    <Menu
                      as="div"
                      className={twMerge(
                        "relative ml-3 inline-flex items-center border-b-2 border-transparent px-1 pt-1 hover:border-gray-300",
                        location.pathname === slugs.report1 &&
                          "border-white font-semibold",
                      )}
                    ></Menu>
                  </div>
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
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

            <Disclosure.Panel className="sm:hidden">
              <div className="space-y-1 pb-4 pt-2">
                {filteredMenuItems.map((item) => (
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
                ))}
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </>
  );
}
