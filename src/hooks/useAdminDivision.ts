import { useEffect, useState } from "react";
import { API_PROVINCE } from "@/api/middleware";
import { api } from "@/api/api";

export default function useAdminDivision(
  province: any,
  district: any,
  setDistrict: any,
  setWard: any,
) {
  const [listProvince, setListProvince] = useState<any>([]);
  const [listDistrict, setListDistrict] = useState<any>([]);
  const [listWard, setListWard] = useState<any>([]);

  useEffect(() => {
    api.get("/api/areas/lookup?region=SOUTH").then((result) => {
      if (result) {
        const list = formatList(result.data);
        setListProvince(list);
      }
    });
  }, []);
  useEffect(() => {
    // if (listProvince.length > 0 && province) {
    //   const provinceIndex = listProvince.findIndex(
    //     (item: any) => item.value === province.value,
    //   );
    useEffect(() => {
    console.log("province =", province);
    console.log("listProvince =", listProvince);

    if (listProvince.length > 0 && province) {
      const provinceIndex = listProvince.findIndex(
        (item: any) => item.value === province.value,
      );

      console.log("province.value =", province?.value);
      console.log("provinceIndex =", provinceIndex);

      if (provinceIndex > -1) {
        const url = "/p/" + listProvince[provinceIndex].item.code + "?depth=2";

        console.log("Calling API:", url);

        API_PROVINCE.get(url).then((result) => {
          console.log("API result =", result);

          if (result) {
            const list = formatList(result.data.districts);
            setListDistrict(list);

            if (listDistrict.length > 0) setDistrict("");
          }
        });
      }
    }
  }, [province, listProvince]);
      if (provinceIndex > -1) {
        const url = "/p/" + listProvince[provinceIndex].item.code + "?depth=2";
        API_PROVINCE.get(url).then((result) => {
          if (result) {
            const list = formatList(result.data.districts);
            setListDistrict(list);
            if (listDistrict.length > 0) setDistrict("");
          }
        });
      }
    }
  }, [province, listProvince]);

  useEffect(() => {
    if (!district) setWard("");

    if (listDistrict.length > 0 && district) {
      const districtIndex = listDistrict.findIndex(
        (item: any) => item.value === district.value,
      );
      if (districtIndex > -1) {
        const url = "/d/" + listDistrict[districtIndex].item.code + "?depth=2";
        API_PROVINCE.get(url).then((result) => {
          if (result) {
            const list = formatList(result.data.wards);
            setListWard(list);
            if (listWard.length > 0) setWard("");
          }
        });
      }
    } else {
      setListWard([]);
    }
  }, [district, listDistrict]);

  function formatList(list: any) {
    return list.map((item: any) => {
      let result = item.name;
      const listRemove = [
        "Tỉnh ",
        "Thành phố ",
        "Thị xã ",
        "Quận ",
        "Huyện ",
        "Phường ",
        "Xã ",
      ];
      listRemove.map((element) => {
        result = result.replace(element, "");
      });

      return {
        value: result,
        label: result,
        item: item,
      };
    });
  }

  return {
    listProvince,
    listDistrict,
    listWard,
  };
}
