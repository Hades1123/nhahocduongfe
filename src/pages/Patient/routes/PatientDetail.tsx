import Button from "@/components/Button";
import Input from "@/components/Input";
import RadioButton from "@/components/RadioButton";
import Select from "@/components/Select";
import { useEffect, useState } from "react";
import MedicalHistoryModal from "../components/medicalHistoryModalForm";
import Card from "@/components/Card";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "@/api/api";
import { useFormik } from "formik";
import { PatientType } from "../type";
import { slugs } from "@/constants/slugs";
import { useQuery } from "react-query";
import Swal from "sweetalert2";
import * as Yup from "yup";
import { getLocalUserInfo } from "@/utils/storage";

interface Props {}

const genders = {
  option: [
    { value: "1", label: "Nam" },
    { value: "2", label: "Nữ" },
  ],
};

const ethnicity = [
  { value: 0, label: "Kinh" },
  { value: 1, label: "Tày" },
  { value: 2, label: "Nùng" },
  { value: 3, label: "Chăm" },
  { value: 4, label: "Khơme" },
  { value: 5, label: "Khác" },
];

const places = [
  { value: 0, label: "Thành thị" },
  { value: 1, label: "Ngoại ô" },
  { value: 2, label: "Nông thôn" },
];

const PatientDetail = (props: Props) => {
  const [isOpenMedicalHistoryModal, setIsOpenMedicalHistoryModal] =
    useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const patientId = Number(location.pathname.split("/")[3]);
  const [chronicConditions, setChronicConditions] = useState<any>([]);
  const userInfor = getLocalUserInfo();
  const organizationType = userInfor?.organization?.type;

  const patientInfoSchema = Yup.object().shape({
    fullName: Yup.string().required("Yêu cầu nhập tên"),
    birthDate: Yup.string().required("Yêu cầu nhập ngày sinh"),
  });

  const getProvincesFetcher = async () => {
    return await api.get("/api/areas/lookup?region=SOUTH").then((result) => {
      return result.data;
    });
  };

  const { data: provinces } = useQuery(
    "getProvincesFetcher",
    getProvincesFetcher,
    {
      refetchOnWindowFocus: false,
    },
  );

  const initialValues: PatientType = {
    fullName: "",
    birthDate: undefined,
    gender: undefined,
    healthInsuranceNumber: undefined,
    ethnic: undefined,
    areaType: undefined,
    province: undefined,
    school: undefined,
    schoolClass: undefined,
    organization: undefined,
    chronicConditions: undefined,
    nationalIdNum: undefined,
    careTaker: undefined,
  };

  const formik = useFormik<PatientType>({
    initialValues: initialValues,
    validationSchema: patientInfoSchema,
    onSubmit: (values) => {
      const chronic = chronicConditions.map((item: any) => ({
        id: item,
      }));

      const submitData: PatientType = {
        code: values.code,
        fullName: values.fullName,
        birthDate: values.birthDate,
        gender: values.gender,
        healthInsuranceNumber: values.healthInsuranceNumber || "",
        ethnic: values.ethnic?.value,
        areaType: values?.areaType?.label || "",
        chronicConditions: chronic?.length > 0 ? chronic : null,
        organization: values.organization ? values.organization : null,
        schoolClass: values.schoolClass || "",
        phoneNumber: "09090901234",
        addressLine: values?.addressLine?.name || "",
        careTaker: values.careTaker || "",
        nationalIdNum: values.nationalIdNum || "",
      };
      Swal.fire({
        html:
          "Bạn có muốn chỉnh sửa học sinh " +
          `<b>${formik.values.fullName}</b>` +
          " không?",
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Chỉnh sửa",
        cancelButtonText: "Huỷ",
        reverseButtons: true,
      }).then((response) => {
        if (response.isConfirmed) {
          api
            .put(`/api/patient/${patientId}`, submitData)
            .then(() =>
              Swal.fire({
                icon: "success",
                title: "Chỉnh sửa học sinh thành công!",
              }).then(() => navigate(slugs.patients)),
            )
            .catch(() =>
              Swal.fire({
                icon: "error",
                title: "Chỉnh sửa học sinh không thành công!",
              }),
            );
        }
      });
    },
    validateOnBlur: true,
  });

  const { data, isLoading, error } = useQuery<any>(
    "patientInfo",
    () =>
      api.get(`/api/patient/${patientId}`).then((response) => response.data),
    { refetchOnWindowFocus: false },
  );

  const { data: organizations } = useQuery(
    `organizations/${formik?.values?.addressLine?.code}`,
    () => {
      const code = formik.values?.addressLine?.code;

      const url = code
        ? `/api/organization/search?areaCode=${code}&size=1000&sort=code,asc`
        : "/api/organization/search?size=1000&sort=code,asc";
      return api.get(url).then((response) => {
        return response.data.content ?? [];
      });
    },
    { refetchOnWindowFocus: false },
  );

  useEffect(() => {
    formik.setFieldValue("organization", data?.organization);
  }, []);

  useEffect(() => {
    if (!data) return;

    formik.setValues({
      ...data,
      ethnic: ethnicity.find((item) => item.value === data.ethnic),
      areaType: places.find((item) => item.label === data.areaType),
      addressLine: provinces?.find(
        (item: any) => item.name === data.addressLine,
      ),
    });
    setChronicConditions(
      data.chronicConditions.map((item: any) => item.id.toString()),
    );
  }, [data, provinces]);

  const handleViewHealthCheckHistory = () => {
    navigate(`/patient/${patientId}/healthCheckHistory`);
  };

  function flattenObject(obj: any) {
    const flattenedArray = [];

    // Iterate over each key-value pair in the object
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        // If the value is an array, concatenate it with the flattened array
        if (Array.isArray(value)) {
          flattenedArray.push(...value);
        }
      }
    }

    return flattenedArray;
  }

  const handleChangeArea = (value: any) => {
    formik.setFieldValue("addressLine", value);
    formik.setFieldValue("organization", "");
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error</div>;
  }

  const handleBack = () => {
    Swal.fire({
      html: "Bạn có muốn quay lại màn hình chính không?",
      showCancelButton: true,
      focusConfirm: false,
      confirmButtonText: "Quay lại",
      cancelButtonText: "Hủy",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        navigate(slugs.patients);
      }
    });
  };
  return (
    <>
      {isOpenMedicalHistoryModal && (
        <MedicalHistoryModal
          isOpen={isOpenMedicalHistoryModal}
          setIsOpen={setIsOpenMedicalHistoryModal}
          chronicConditions={chronicConditions}
          setChronicConditions={setChronicConditions}
        />
      )}
      <form onSubmit={formik.handleSubmit}>
        <Card>
          <div className="grid grid-cols-5 ">
            <div className="col-span-1 ">
              <div className="flex flex-col gap-5">
                <span className="inline-block h-44 w-44 overflow-hidden rounded-full bg-gray-100">
                  <svg
                    className="h-full w-full text-gray-300"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </span>
                <div className="mb-2 flex w-44 flex-col justify-center gap-2">
                  <Button
                    variants="outlined"
                    onClick={() => setIsOpenMedicalHistoryModal(true)}
                  >
                    Tiền sử bệnh
                  </Button>
                  <Button
                    variants="outlined"
                    onClick={handleViewHealthCheckHistory}
                  >
                    Lịch sử khám
                  </Button>
                </div>
              </div>
            </div>
            <div className="col-span-4 grid gap-6">
              <h1 className="text-lg font-bold">Thông tin học sinh</h1>
              <div className=" grid grid-cols-4 gap-8">
                <Input label="Mã HS" value={formik.values.code} disabled />
                <Input
                  label="Họ và tên"
                  value={formik.values.fullName}
                  onChange={formik.handleChange}
                  name="fullName"
                  error={formik.touched.fullName ? formik.errors.fullName : ""}
                  required
                />
                <Input
                  label="Ngày sinh"
                  type="date"
                  value={formik.values.birthDate}
                  onChange={formik.handleChange}
                  name="birthDate"
                  error={
                    formik.touched.birthDate ? formik.errors.birthDate : ""
                  }
                  required
                />
                <div className="grid grid-cols-1 gap-4 text-sm font-semibold">
                  Giới tính
                  <div className="grid-row-1 flex gap-4">
                    {genders.option.map((gender) => (
                      <RadioButton
                        label={gender.label}
                        value={gender.value}
                        name="gender"
                        onClick={(value) =>
                          formik.setFieldValue("gender", value.target.value)
                        }
                        id={gender.value}
                        key={gender.value}
                        checked={String(formik.values?.gender) === gender.value}
                      />
                    ))}
                  </div>
                  {
                    <p className="-mt-2 text-sm text-red-600" id="email-error">
                      {formik.errors.gender}
                    </p>
                  }
                </div>
              </div>
              {organizationType ? (
                <>
                  <div className=" grid grid-cols-4 gap-8">
                    <Select
                      label="Lớp"
                      options={flattenObject(
                        formik.values.organization?.classes,
                      )}
                      getOptionLabel={(option) => option}
                      value={formik.values.schoolClass}
                      name="schoolClass"
                      onChange={(value) =>
                        formik.setFieldValue("schoolClass", value)
                      }
                    />
                    <Select
                      label="Vùng địa dư"
                      name="areaType"
                      options={places}
                      placeholder="Chọn vùng địa dư"
                      value={formik.values.areaType}
                      onChange={(value) =>
                        formik.setFieldValue("areaType", value)
                      }
                    />
                    <Input
                      label="Mã định danh"
                      value={formik.values.nationalIdNum}
                      name="nationalIdNum"
                      onChange={formik.handleChange}
                    />
                    <Select
                      label="Dân tộc"
                      options={ethnicity}
                      name="ethnic"
                      placeholder="Chọn dân tộc"
                      value={formik.values.ethnic}
                      onChange={(value) =>
                        formik.setFieldValue("ethnic", value)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-8">
                    <Input
                      label="Mã thẻ BHYT"
                      type="add"
                      value={formik.values.healthInsuranceNumber}
                      onChange={formik.handleChange}
                      name="healthInsuranceNumber"
                    />
                    <Input
                      label="Người giám hộ"
                      type="add"
                      value={formik.values.careTaker}
                      onChange={formik.handleChange}
                      name="careTaker"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className=" grid grid-cols-4 gap-8">
                    <Select
                      label="Tỉnh/ Thành"
                      options={provinces}
                      placeholder="Chọn tỉnh thành"
                      value={formik.values.addressLine}
                      name="addressLine"
                      onChange={handleChangeArea}
                      getOptionLabel={(option) => option.name}
                    />
                    <Select
                      label="Trường học"
                      fullWidth
                      getOptionLabel={(option) => option?.name}
                      options={organizations as any}
                      placeholder="Chọn trường học"
                      value={formik.values.organization}
                      name="organization"
                      onChange={(value) => {
                        formik.setFieldValue("organization", value);
                      }}
                    />
                    <Select
                      label="Lớp"
                      options={flattenObject(
                        formik.values.organization?.classes,
                      )}
                      getOptionLabel={(option) => option}
                      value={formik.values.schoolClass}
                      name="schoolClass"
                      onChange={(value) =>
                        formik.setFieldValue("schoolClass", value)
                      }
                    />
                    <Select
                      label="Vùng địa dư"
                      name="areaType"
                      options={places}
                      placeholder="Chọn vùng địa dư"
                      value={formik.values.areaType}
                      onChange={(value) =>
                        formik.setFieldValue("areaType", value)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-8">
                    <Input
                      label="Mã định danh"
                      value={formik.values.nationalIdNum}
                      name="nationalIdNum"
                      onChange={formik.handleChange}
                    />
                    <Select
                      label="Dân tộc"
                      options={ethnicity}
                      name="ethnic"
                      placeholder="Chọn dân tộc"
                      value={formik.values.ethnic}
                      onChange={(value) =>
                        formik.setFieldValue("ethnic", value)
                      }
                    />
                    <Input
                      label="Mã thẻ BHYT"
                      type="add"
                      value={formik.values.healthInsuranceNumber}
                      onChange={formik.handleChange}
                      name="healthInsuranceNumber"
                    />
                    <Input
                      label="Người giám hộ"
                      type="add"
                      value={formik.values.careTaker}
                      onChange={formik.handleChange}
                      name="careTaker"
                    />
                  </div>
                </>
              )}
              <div className="mt-10 flex items-center justify-end gap-6">
                <Button variants="outlined" onClick={handleBack}>
                  Quay lại
                </Button>
                <Button type="submit">Chỉnh sửa</Button>
              </div>
            </div>
          </div>
        </Card>
      </form>
    </>
  );
};
export { PatientDetail };
