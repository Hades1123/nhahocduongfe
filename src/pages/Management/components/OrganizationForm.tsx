import Button from "@/components/Button";
import Card from "@/components/Card";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { useFormik } from "formik";
import { useQuery } from "react-query";
import { IOrganization } from "../type";
import { api } from "@/api/api";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import {
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  Paper,
  TableBody,
} from "@mui/material";
import { MuiChipsInput } from "mui-chips-input";
import { styled } from "@mui/material/styles";
import { omit } from "lodash";

interface Props {
  isEdit: boolean;
  organizationId?: any;
  onSuccess?: () => void;
}

const CustomMuiChipsInput = styled(MuiChipsInput)({
  "& .MuiOutlinedInput-notchedOutline": {
    // Override the styles here
    border: "hidden",
  },
  "& .MuiInputBase-root": {
    "&.MuiOutlinedInput-root": {
      fontSize: "inherit",
    },
  },
  "& input": {
    "&:focus": {
      boxShadow: "none",
    },
  },
});

const getProvincesFetcher = async () => {
  return await api.get("/api/areas/lookup?region=SOUTH").then((result) => {
    return result.data;
  });
};

const getOrganizesById = async (id: string) => {
  return await api.get(`/api/organizations/${id}`).then((res) => res.data);
};

const init = {
  name: "",
  address: "",
  areaCode: "",
  classes: {},
  inputClassName: "",
};

const OrganizationForm = ({
  isEdit = false,
  organizationId,
  onSuccess,
}: Props) => {
  const [valuesOnchange, setValueOnchange] = useState<any>();
  const [valueDelete, setValueDelete] = useState();
  const [rowDelete, setRowDelete] = useState<any>();
  const [addOrDeleteChip, setAddOrDeleteChip] = useState<boolean>(false);

  const { data: provinces } = useQuery(
    "getProvincesFetcher",
    getProvincesFetcher,
    {
      refetchOnWindowFocus: false,
    },
  );

  const { data: organization } = useQuery(
    "getOrganizesById",
    () => getOrganizesById(organizationId),
    {
      refetchOnWindowFocus: false,
      enabled: isEdit && !!provinces,
    },
  );

  const formik = useFormik<IOrganization>({
    initialValues: init,
    onSubmit: (values: any) => {
      // Validate bắt buộc
      if (!values.address || !values.address.name) {
        Swal.fire({
          icon: "warning",
          title: "Vui lòng chọn Tỉnh/ thành trước khi lưu!",
        });
        return;
      }
      if (!values.name || !values.name.trim()) {
        Swal.fire({
          icon: "warning",
          title: "Vui lòng nhập Tên trường!",
        });
        return;
      }

      const compactData = omit(values, "inputClassName");

      const submitData = {
        ...compactData,
        address: values.address?.name ?? "",
        code: values.areaCode,
        areaCode: values.address?.code ?? "",
      };

      if (isEdit) {
        Swal.fire({
          icon: "info",
          html:
            "Bạn muốn chỉnh sửa trường học " +
            `<b>${formik.values.name}</b>` +
            " không?",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Chỉnh sửa",
          cancelButtonText: "Huỷ",
          reverseButtons: true,
        }).then((response) => {
          if (response.isConfirmed) {
            api
              .put(`/api/organization/${organizationId}`, submitData)
              .then(() => {
                Swal.fire({
                  icon: "success",
                  title: "Chỉnh sửa trường học thành công",
                }),
                  onSuccess && onSuccess();
              })
              .catch((err) =>
                Swal.fire({
                  icon: "error",
                  title:
                    "Chỉnh sửa trường học không thành công, tên lớp không được trùng!",
                }),
              );
          }
        });
      } else {
        api
          .post("/api/organization", submitData)
          .then(() => {
            Swal.fire({
              icon: "success",
              title: "Thêm trường học thành công",
            });
            onSuccess && onSuccess();
          })
          .catch((err) => {
            if (err.response.status) {
              Swal.fire({
                icon: "error",
                title:
                  "Thêm trường không thành công, tên lớp không được trùng!",
              });
            }
          });
      }
    },
  });

  function handleChange(value: any) {
    setValueOnchange(value);
  }

  useEffect(() => {
    handleChange(valuesOnchange);
  }, [valuesOnchange, valueDelete, rowDelete]);

  useEffect(() => {
    if (addOrDeleteChip) {
      handleDeleteChip(valueDelete, rowDelete);
    } else {
      handleAddChip(valueDelete, rowDelete);
    }
  }, [valueDelete, rowDelete, addOrDeleteChip]);

  function handleDeleteChip(values: any, row: string) {
    setAddOrDeleteChip(true);
    setValueDelete(values);
    setRowDelete(row);
    if (isEdit) {
      if (valuesOnchange) {
        Swal.fire({
          html: `Bạn có muốn xoá lớp học ` + `<b>${values}</b>` + ` không?`,
          icon: "info",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Xoá",
          cancelButtonText: "Huỷ",
          reverseButtons: true,
        }).then((response) => {
          if (response.isConfirmed) {
            api
              .post(`/api/organization/${organizationId}/classes/deletable`, [
                values,
              ])
              .then((response) => {
                if (response.data.errorCount > 0) {
                  Swal.fire({
                    icon: "error",
                    html: "Xóa lớp học không thành công, không thể xóa lớp học đang có học sinh!",
                  });
                } else if (response.data.successCount > 0) {
                  Swal.fire({
                    icon: "success",
                    html: "Xóa lớp học thành công!",
                  });
                  const newValue = { ...formik.values.classes };
                  newValue[row as any] = valuesOnchange;
                  formik.setFieldValue("classes", newValue);
                  setAddOrDeleteChip(false);
                }
              });
          }
        });
      }
    } else {
      if (valuesOnchange) {
        const newValue = { ...formik.values.classes };
        newValue[row as any] = valuesOnchange;
        formik.setFieldValue("classes", newValue);
        setAddOrDeleteChip(false);
      }
    }
  }

  function handleAddChip(values: any, row: string) {
    setAddOrDeleteChip(false);
    setValueDelete(values);
    setRowDelete(row);
    const newValue = { ...formik.values.classes };
    newValue[row as any] = valuesOnchange;
    formik.setFieldValue("classes", newValue);
  }

  function handleDeleteAllClasses(value: any, index: any) {
    Swal.fire({
      html: `Bạn có muốn xoá tất cả lớp học không?`,
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Xoá",
      cancelButtonText: "Huỷ",
      reverseButtons: true,
    }).then((response) => {
      if (response.isConfirmed) {
        api
          .post(
            `/api/organization/${organizationId}/classes/deletable`,
            value[index],
          )
          .then((response) => {
            if (response.data.errorCount > 0) {
              Swal.fire({
                icon: "error",
                html: "Xóa tất cả các lớp không thành công, có tồn tại lớp học đang có học sinh!",
              });
              setAddOrDeleteChip(false);
            }

            if (response.data.successCount > 0) {
              Swal.fire({
                icon: "success",
                html:
                  "Xóa " +
                  `<b>${response.data.errorCount}</b>` +
                  " lớp không thành công và " +
                  `<b>${response.data.successCount}</b>` +
                  " lớp thành công, do lớp có đã tồn tại học sinh!",
              });

              let classAfterDelete: any = [];

              response.data.errorList.forEach((element: any) => {
                classAfterDelete.push(element.content);
              });
              const newValue = { ...formik.values.classes };
              newValue[index as any] = classAfterDelete;
              formik.setFieldValue("classes", newValue);
              setAddOrDeleteChip(false);
            }
          });
      }
    });
  }

  useEffect(() => {
    if (!organization || !isEdit) {
      formik.setFieldValue("classes", {});
    } else {
      const address = provinces.find(
        (item: any) => item.name === organization.address,
      );
      formik.setFieldValue("name", organization.name);
      formik.setFieldValue("areaCode", organization.code);
      formik.setFieldValue("address", address);
      formik.setFieldValue("classes", organization.classes);
    }
  }, [organization]);

  return (
    <form onSubmit={formik.handleSubmit}>
      <Card className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-8">
          <Select
            name="address"
            label="Tỉnh/ thành"
            placeholder="Chọn tỉnh/ thành"
            options={provinces}
            value={formik.values.address}
            onChange={(value) => formik.setFieldValue("address", value)}
            getOptionLabel={(option) => option.name}
          />
          {isEdit ? (
            <Input
              value={formik.values.areaCode}
              onChange={formik.handleChange}
              name="code"
              label="Mã trường"
              placeholder="--"
              disabled
            />
          ) : null}
          <Input
            value={formik.values.name}
            onChange={formik.handleChange}
            name="name"
            label="Tên trường"
            placeholder="Nhập tên trường"
          />
        </div>
      </Card>
      <div className="mt-4 ">
        <Card header="Thêm mới khối và lớp" className="flex flex-col gap-4 ">
          <div className="flex h-fit w-fit grid-cols-3 items-center gap-8">
            <Input
              name="inputClassName"
              value={formik.values.inputClassName}
              onChange={formik.handleChange}
              placeholder="Nhập tên khối..."
            />
            <Button
              onClick={() => {
                const newValue = { ...formik.values.classes };
                newValue[formik.values.inputClassName as any] = [];
                formik.setFieldValue("classes", newValue);
                formik.setFieldValue("inputClassName", "");
              }}
              className=" h-fit w-fit"
            >
              Thêm mới
            </Button>
          </div>

          {/* ═══ DESKTOP TABLE (≥1024px) ═══ */}
          <div className="hidden lg:block">
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="caption table">
                <caption>* Các lớp được thêm sẽ hiển thị ở đây.</caption>
                <TableHead>
                  <TableRow>
                    <TableCell style={{ width: "150px" }} align="center">
                      Khối
                    </TableCell>
                    <TableCell align="center" style={{ width: "150px" }}>
                      Danh sách lớp
                    </TableCell>
                    <TableCell align="center" style={{ width: "150px" }}>
                      Thao tác
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.keys(formik.values?.classes || {}).map(
                    (row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        <TableCell style={{ width: "150px" }} align="center">
                          {row}
                        </TableCell>
                        <TableCell align="center">
                          <CustomMuiChipsInput
                            className="text-sm"
                            value={formik.values.classes[row as any]}
                            placeholder="Nhập tên lớp..."
                            hideClearAll={true}
                            onChange={(values) => handleChange(values)}
                            onDeleteChip={(value) =>
                              handleDeleteChip(value, row)
                            }
                            onAddChip={(value) => handleAddChip(value, row)}
                          />
                        </TableCell>
                        <TableCell align="center" style={{ width: "150px" }}>
                          <Button
                            onClick={(value) =>
                              handleDeleteAllClasses(
                                { ...formik.values.classes },
                                row,
                              )
                            }
                            variants="outlined"
                          >
                            <CloseIcon />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          {/* ═══ TABLET & MOBILE CARDS (<1024px) ═══ */}
          <div className="flex flex-col gap-3 lg:hidden">
            <p className="text-xs italic text-gray-500">
              * Các lớp được thêm sẽ hiển thị ở đây.
            </p>
            {Object.keys(formik.values?.classes || {}).length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-6 text-center text-sm text-gray-500">
                Chưa có khối nào
              </div>
            )}
            {Object.keys(formik.values?.classes || {}).map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                      {rowIndex + 1}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      Khối {row}
                    </span>
                  </div>
                  <Button
                    onClick={(value: any) =>
                      handleDeleteAllClasses({ ...formik.values.classes }, row)
                    }
                    variants="outlined"
                  >
                    <CloseIcon />
                  </Button>
                </div>
                {/* Card Body */}
                <div className="px-4 py-3">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                    Danh sách lớp
                  </p>
                  <CustomMuiChipsInput
                    className="text-sm"
                    value={formik.values.classes[row as any]}
                    placeholder="Nhập tên lớp..."
                    hideClearAll={true}
                    onChange={(values) => handleChange(values)}
                    onDeleteChip={(value) => handleDeleteChip(value, row)}
                    onAddChip={(value) => handleAddChip(value, row)}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="submit">Lưu</Button>
      </div>
    </form>
  );
};
export default OrganizationForm;
