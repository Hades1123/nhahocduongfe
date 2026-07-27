import jwtDecode from "jwt-decode";
import useAuthStore from "@/stores/authStore";

/**
 * @return token in local storage
 */
export function getLocalUserInfo() {
  const info = useAuthStore.getState().accessToken;
  if (!info) {
    return null;
  }
  const decodeInfo: any = jwtDecode(info as string);
  return decodeInfo;
}
