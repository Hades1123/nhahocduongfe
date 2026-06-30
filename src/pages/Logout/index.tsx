import useAuthStore from "@/stores/authStore";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Props {}

const Logout = (props: Props) => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  useEffect(() => {
    const doLogout = async () => {
      await logout();
      navigate("/login", { replace: true });
    };
    doLogout();
  }, []);

  return <div>Đang đăng xuất ...</div>;
};
export default Logout;
