import jwtDecode from "jwt-decode";

/**
 * @return token in local storage
 */
export function getLocalUserInfo() {
  const info = window.localStorage.getItem("accessToken");
  const decodeInfo: any = jwtDecode(info as string);
  return decodeInfo;
}
