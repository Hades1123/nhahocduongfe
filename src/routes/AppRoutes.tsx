import useAuthStore from "@/stores/authStore";
import { ProtectedRoutes } from "./ProtectedRoutes";
import { PublicRoutes } from "./PublicRoutes";

interface Props {}
const AppRoutes = (props: Props) => {
  const auth = useAuthStore((state) => state.isAuthenticated);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);

  if (isBootstrapping) {
    return null;
  }

  return auth ? <ProtectedRoutes /> : <PublicRoutes />;
};
export { AppRoutes };
