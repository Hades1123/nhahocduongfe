import { Outlet } from "react-router-dom";
import Navbar from "../Navbar";
import Breadcrumb from "../Breadcrumb";

interface Props {}
const Layout = (props: Props) => {
  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-900 theme-page-bg">
      {/* theme-page-bg: hook class for custom palette page background.
           When data-custom-theme is absent → bg-slate-50 wins (Tailwind default).
           When data-custom-theme="active" → overrides with var(--theme-neutral). */}
      <Navbar />
      <div className="mx-auto mb-8 max-w-screen-2xl md:w-auto lg:w-auto">
        <div className="my-3 sm:px-6">
          <Breadcrumb />
        </div>
        <Outlet />
      </div>
    </div>
  );
};
export default Layout;
