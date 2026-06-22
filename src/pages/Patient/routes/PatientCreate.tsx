import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';
import RadioButton from '@/components/RadioButton';
import Select from '@/components/Select';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MedicalHistoryModal from '../components/medicalHistoryModalForm';
import { PatientType } from '../type';
import { api } from '@/api/api';
import { slugs } from '@/constants/slugs';
import Swal from 'sweetalert2';
import * as Yup from 'yup';
import { useQuery } from 'react-query';
import { getLocalUserInfo } from '@/utils/storage';

interface Props {}

const genders = {
  option: [
    { value: '1', label: 'Nam' },
    { value: '2', label: 'Nữ' },
  ],
};

const places = [
  { value: 0, label: 'Thành thị' },
  { value: 1, label: 'Ngoại ô' },
  { value: 2, label: 'Nông thôn' },
];

const ethnicity = [
  { value: 0, label: 'Kinh' },
  { value: 1, label: 'Tày' },
  { value: 2, label: 'Nùng' },
  { value: 3, label: 'Chăm' },
  { value: 4, label: 'Khơme' },
  { value: 5, label: 'Khác' },
];

type Ethnic = {
  value: number;
  labe: string;
};

const PatientCreate = (props: Props) => {
  const [isOpenMedicalHistoryModal, setIsOpenMedicalHistoryModal] = useState<boolean>(false);
  const [chronicConditions, setChronicConditions] = useState<any>([]);
  const navigate = useNavigate();
  const userInfor = getLocalUserInfo();
  const organizationType = userInfor?.organization?.type;

  const getProvincesFetcher = async () => {
    return await api.get('/api/areas/lookup?region=SOUTH').then((result) => {
      return result.data;
    });
  };

  const { data: provinces } = useQuery('getProvincesFetcher', getProvincesFetcher, {
    refetchOnWindowFocus: false,
  });

  const patientInfoSchema = Yup.object().shape({
    fullName: Yup.string().required('Vui lòng nhập tên'),
    gender: Yup.number().required('Vui lòng chọn giới tính'),
    birthDate: Yup.string().required('Vui lòng nhập ngày sinh'),
    addressLine: Yup.object().required('Vui lòng chọn Tỉnh/ Thành'),
    organization: Yup.object().required('Vui lòng chọn trường học'),
    schoolClass: Yup.string().required('Vui lòng chọn lớp'),
  });

  const patientInfoSchemaForAccount = Yup.object().shape({
    fullName: Yup.string().required('Vui lòng nhập tên'),
    gender: Yup.number().required('Vui lòng chọn giới tính'),
    birthDate: Yup.string().required('Vui lòng nhập ngày sinh'),
    schoolClass: Yup.string().required('Vui lòng chọn lớp'),
  });

  const initialValues: PatientType = {
    fullName: '',
    birthDate: undefined,
    gender: undefined,
    healthInsuranceNumber: '',
    ethnic: undefined,
    areaType: undefined,
    chronicConditions: undefined,
    organization: undefined,
    schoolClass: undefined,
    phoneNumber: undefined,
    addressLine: undefined,
    careTaker: undefined,
    nationalIdNum: undefined,
  };

  const formik = useFormik({
    initialValues: initialValues,
    validationSchema: !organizationType ? patientInfoSchema : patientInfoSchemaForAccount,
    onSubmit: (values) => {
      const chronic = chronicConditions.map((item: any) => ({
        id: item,
      }));

      const submitData: PatientType = {
        fullName: values.fullName,
        birthDate: values.birthDate,
        gender: values.gender,
        healthInsuranceNumber: values.healthInsuranceNumber || '',
        ethnic: values.ethnic?.value,
        areaType: values?.areaType?.label || '',
        chronicConditions: chronic?.length > 0 ? chronic : null,
        organization: values.organization?.id
          ? { id: values.organization?.id }
          : { id: userInfor.organization?.id },
        schoolClass: values.schoolClass || '',
        phoneNumber: '09090901234',
        addressLine: values.addressLine?.name
          ? values.addressLine.name
          : userInfor.organization.address,
        careTaker: values.careTaker || '',
        nationalIdNum: values.nationalIdNum || '',
      };
      Swal.fire({
        html: 'Bạn có muốn thêm học sinh ' + `<b>${formik.values.fullName}</b>` + ' không?',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Thêm',
        cancelButtonText: 'Huỷ',
        reverseButtons: true,
      }).then((response) => {
        if (response.isConfirmed) {
          api
            .post('/api/patient', submitData)
            .then(() =>
              Swal.fire({
                icon: 'success',
                title: 'Thêm học sinh thành công!',
              }).then(() => navigate(slugs.patients))
            )
            .catch(() =>
              Swal.fire({
                icon: 'error',
                title: 'Thêm học sinh không thành công!',
              })
            );
        }
      });
    },
  });

  const { data: organizations } = useQuery(
    `organizations/${formik?.values?.addressLine?.code}`,
    () => {
      const code = formik.values?.addressLine?.code;

      if (!code) return [];

      const url = code ? `/api/organization/search?areaCode=${code}` : '/api/organization/search';
      return api.get(url).then((response) => {
        if (code) return response.data.content;
        return response.data.content;
      });
    },
    { refetchOnWindowFocus: false }
  );

  function flattenObject(obj: any) {
    const flattenedArray = [];

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        if (Array.isArray(value)) {
          flattenedArray.push(...value);
        }
      }
    }

    return flattenedArray;
  }

  useEffect(() => {
    if (formik.values.addressLine) {
      formik.setFieldValue('organization', null);
    }
  }, [formik.values.addressLine]);

  const handleBack = () => {
    Swal.fire({
      html: 'Bạn có muốn quay lại màn hình chính không?',
      showCancelButton: true,
      focusConfirm: false,
      confirmButtonText: 'Quay lại',
      cancelButtonText: 'Hủy',
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
          <div className="grid grid-cols-5">
            <div className=" col-span-1">
              <div className="flex flex-col gap-4">
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
                  <Button variants="outlined" onClick={() => setIsOpenMedicalHistoryModal(true)}>
                    Tiền sử bệnh
                  </Button>
                </div>
              </div>
            </div>
            <div className="col-span-4 grid gap-6">
              <h1 className="text-lg font-bold">Thông tin học sinh</h1>
              <div className=" grid grid-cols-4 gap-8">
                <Input label="Mã HS" disabled />
                <Input
                  label="Họ và tên"
                  value={formik.values.fullName}
                  onChange={formik.handleChange}
                  name="fullName"
                  error={formik.touched.fullName ? formik.errors.fullName : ''}
                  required
                />
                <Input
                  label="Ngày sinh"
                  type="date"
                  value={formik.values.birthDate}
                  onChange={formik.handleChange}
                  name="birthDate"
                  error={formik.touched.birthDate ? formik.errors.birthDate : ''}
                  required
                />
                <div className="relative grid grid-cols-1 gap-4 text-sm font-semibold">
                  <div>
                    Giới tính
                    <span className="text-red-500">*</span>
                  </div>
                  <div className="grid-row-1 flex gap-4">
                    {genders.option.map((gender) => (
                      <RadioButton
                        label={gender.label}
                        value={gender.value}
                        name="gender"
                        onClick={(value) => formik.setFieldValue('gender', value.target.value)}
                        checked={String(formik.values?.gender) === gender.value}
                        id={gender.value}
                        key={gender.value}
                      />
                    ))}
                  </div>
                  {
                    <p
                      className="absolute -bottom-6 -mt-2 text-sm font-normal text-red-600"
                      id="email-error"
                    >
                      {formik.touched.gender && formik.errors.gender}
                    </p>
                  }
                </div>
              </div>
              {organizationType ? (
                <>
                  <div className=" grid grid-cols-4 gap-8">
                    <Select
                      label="Lớp"
                      placeholder="Chọn lớp"
                      options={flattenObject(userInfor.organization.classes)}
                      getOptionLabel={(option) => option}
                      value={formik.values.schoolClass}
                      name="schoolClass"
                      onChange={(value) => formik.setFieldValue('schoolClass', value)}
                      required
                      error={formik.touched.schoolClass ? formik.errors.schoolClass : ''}
                    />
                    <Select
                      label="Vùng địa dư"
                      name="areaType"
                      options={places}
                      placeholder="Chọn vùng địa dư"
                      value={formik.values.areaType}
                      onChange={(value) => formik.setFieldValue('areaType', value)}
                    />
                    <Input
                      label="Mã định danh"
                      value={formik.values.nationalIdNum}
                      name="nationalIdNum"
                      onChange={formik.handleChange}
                    />
                    <div className="relative">
                      <Select
                        label="Dân tộc"
                        options={ethnicity}
                        name="ethnic"
                        placeholder="Chọn dân tộc"
                        value={formik.values.ethnic}
                        onChange={(value) => formik.setFieldValue('ethnic', value)}
                      />
                      {formik.errors.ethnic && (
                        <span className="absolute text-sm text-red-600">
                          {formik.errors.ethnic as React.ReactNode}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className=" grid grid-cols-4 gap-8"></div>
                  <div className="grid grid-cols-4 gap-8">
                    <Input
                      label="Mã thẻ BHYT"
                      value={formik.values.healthInsuranceNumber}
                      onChange={formik.handleChange}
                      name="healthInsuranceNumber"
                    />
                    <Input
                      label="Người giám hộ"
                      value={formik.values.careTaker}
                      name="careTaker"
                      onChange={formik.handleChange}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className=" grid grid-cols-4 gap-8">
                    console.log("provinces =", provinces);
                    <Select
                      label="Tỉnh/ Thành"
                      options={provinces}
                      placeholder="Chọn tỉnh thành"
                      value={formik.values.addressLine}
                      getOptionLabel={(option) => option.name}
                      name="addressLine"
                      // onChange={(value) => formik.setFieldValue('addressLine', value)}
                      onChange={(value) => {
                        console.log("===========");
                        console.log("selected province =", value);
                        formik.setFieldValue("addressLine", value);
                      }}
                      required
                      error={formik.touched.addressLine ? formik.errors.addressLine : ''}
                    />
                    <Select
                      label="Trường học"
                      fullWidth
                      getOptionLabel={(option) => option?.name}
                      options={organizations}
                      placeholder="Chọn trường học"
                      value={formik.values.organization}
                      name="organization"
                      onChange={(value) => {
                        formik.setFieldValue('organization', value);
                      }}
                      required
                      error={formik.touched.organization ? formik.errors.organization : ''}
                    />
                    <Select
                      label="Lớp"
                      placeholder="Chọn lớp"
                      options={flattenObject(formik.values.organization?.classes)}
                      getOptionLabel={(option) => option}
                      value={formik.values.schoolClass}
                      name="schoolClass"
                      onChange={(value) => formik.setFieldValue('schoolClass', value)}
                      required
                      error={formik.touched.schoolClass ? formik.errors.schoolClass : ''}
                    />
                    <Select
                      label="Vùng địa dư"
                      name="areaType"
                      options={places}
                      placeholder="Chọn vùng địa dư"
                      value={formik.values.areaType}
                      onChange={(value) => formik.setFieldValue('areaType', value)}
                    />
                  </div>
                  <div className=" grid grid-cols-4 gap-8"></div>
                  <div className="grid grid-cols-4 gap-8">
                    <Input
                      label="Mã định danh"
                      value={formik.values.nationalIdNum}
                      name="nationalIdNum"
                      onChange={formik.handleChange}
                    />
                    <div className="relative">
                      <Select
                        label="Dân tộc"
                        options={ethnicity}
                        name="ethnic"
                        placeholder="Chọn dân tộc"
                        value={formik.values.ethnic}
                        onChange={(value) => formik.setFieldValue('ethnic', value)}
                      />
                      {formik.errors.ethnic && (
                        <span className="absolute text-sm text-red-600">
                          {formik.errors.ethnic as React.ReactNode}
                        </span>
                      )}
                    </div>
                    <Input
                      label="Mã thẻ BHYT"
                      value={formik.values.healthInsuranceNumber}
                      onChange={formik.handleChange}
                      name="healthInsuranceNumber"
                    />
                    <Input
                      label="Người giám hộ"
                      value={formik.values.careTaker}
                      name="careTaker"
                      onChange={formik.handleChange}
                    />
                  </div>
                </>
              )}
              <div className="grid grid-cols-4 gap-8"></div>
              <div className="flex items-center justify-end gap-6">
                <Button variants="outlined" onClick={handleBack}>
                  Quay lại
                </Button>
                <Button type="submit">Thêm</Button>
              </div>
            </div>
          </div>
        </Card>
      </form>
    </>
  );
};
export { PatientCreate };
