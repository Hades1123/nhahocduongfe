import React, { useRef, useState, ForwardedRef, useEffect } from "react";
import Select from "@/components/Select";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useLocation } from "react-router-dom";
import { api } from "@/api/api";

interface Props {
  onChange?: (value: any) => void;
  selectedExam?: any;
}

const TeethOverall = React.forwardRef<HTMLDivElement, Props>(
  ({ selectedExam }, ref: ForwardedRef<HTMLDivElement>) => {
    const useDataRef = useRef({});
    const [plaqueDataFetching, setPlaqueDataFetching] = useState<any>();
    const [tartarDataFetching, setTartarDataFetching] = useState<any>();
    const optionsLeft: { value: string; label: string }[] = [
      { value: "0", label: "Không có mảng bám" },
      { value: "1", label: "Mảng bám 1/3 cổ răng / vết dính" },
      { value: "2", label: "Mảng bám 2/3 răng" },
      { value: "3", label: "Mảng bám > 2/3 răng" },
      { value: "4", label: "Không có răng" },
    ];

    const optionsRight: { value: string; label: string }[] = [
      { value: "0", label: "Không có vôi răng" },
      { value: "1", label: "Vôi răng 1/3 cổ răng" },
      { value: "2", label: "Vôi răng 2/3 răng" },
      { value: "3", label: "Vôi răng > 2/3 răng" },
      { value: "4", label: "Không có răng" },
    ];

    const validationSchema = Yup.object().shape({
      teethLeft1: Yup.string().required("Vui lòng chọn giá trị"),
      teethLeft2: Yup.string().required("Vui lòng chọn giá trị"),
      teethLeft3: Yup.string().required("Vui lòng chọn giá trị"),
      teethLeft4: Yup.string().required("Vui lòng chọn giá trị"),
      teethLeft5: Yup.string().required("Vui lòng chọn giá trị"),
      teethLeft6: Yup.string().required("Vui lòng chọn giá trị"),
      teethRight1: Yup.string().required("Vui lòng chọn giá trị"),
      teethRight2: Yup.string().required("Vui lòng chọn giá trị"),
      teethRight3: Yup.string().required("Vui lòng chọn giá trị"),
      teethRight4: Yup.string().required("Vui lòng chọn giá trị"),
      teethRight5: Yup.string().required("Vui lòng chọn giá trị"),
      teethRight6: Yup.string().required("Vui lòng chọn giá trị"),
    });
    const url = useLocation().pathname.split("/");
    const idExam = useRef();

    const formik = useFormik({
      initialValues: {
        teethLeft1: "",
        teethLeft2: "",
        teethLeft3: "",
        teethLeft4: "",
        teethLeft5: "",
        teethLeft6: "",
        teethRight1: "",
        teethRight2: "",
        teethRight3: "",
        teethRight4: "",
        teethRight5: "",
        teethRight6: "",
      },
      validationSchema: validationSchema,
      onSubmit: (values: any) => {
        const plaqueRecord = {
          "17-16n": values.teethLeft1?.value || "",
          "11n": values.teethLeft2?.value || "",
          "26-27n": values.teethLeft3?.value || "",
          "47-46t": values.teethLeft4?.value || "",
          "31n": values.teethLeft5?.value || "",
          "36-37t": values.teethLeft6?.value || "",
        };

        const tartarRecord = {
          "17-16n": values.teethRight1?.value || "",
          "11n": values.teethRight2?.value || "",
          "26-27n": values.teethRight3?.value || "",
          "47-46t": values.teethRight4?.value || "",
          "31n": values.teethRight5?.value || "",
          "36-37t": values.teethRight6?.value || "",
        };
        useDataRef.current = { plaqueRecord, tartarRecord };
      },
    });

    useEffect(() => {
      api
        .get(
          `/api/patients/${
            url[url.length - 2]
          }/exams/${selectedExam}/plaqueRecord`,
        )
        .then((response) => setPlaqueDataFetching(response.data));
    }, [selectedExam]);

    useEffect(() => {
      api
        .get(
          `/api/patients/${
            url[url.length - 2]
          }/exams/${selectedExam}/tartarRecord`,
        )
        .then((response) => setTartarDataFetching(response.data));
    }, [selectedExam]);

    useEffect(() => {
      if (!plaqueDataFetching && !tartarDataFetching) return;

      formik.setValues({
        teethLeft1: optionsLeft.find((item) =>
          !plaqueDataFetching
            ? ""
            : item.value === plaqueDataFetching["17-16n"],
        ),
        teethLeft2: optionsLeft.find((item) =>
          !plaqueDataFetching ? "" : item.value === plaqueDataFetching["11n"],
        ),
        teethLeft3: optionsLeft.find((item) =>
          !plaqueDataFetching
            ? ""
            : item.value === plaqueDataFetching["26-27n"],
        ),
        teethLeft4: optionsLeft.find((item) =>
          !plaqueDataFetching
            ? ""
            : item.value === plaqueDataFetching["47-46t"],
        ),
        teethLeft5: optionsLeft.find((item) =>
          !plaqueDataFetching ? "" : item.value === plaqueDataFetching["31n"],
        ),
        teethLeft6: optionsLeft.find((item) =>
          !plaqueDataFetching
            ? ""
            : item.value === plaqueDataFetching["36-37t"],
        ),

        teethRight1: optionsRight.find((item) =>
          !tartarDataFetching
            ? ""
            : item.value === tartarDataFetching["17-16n"],
        ),
        teethRight2: optionsRight.find((item) =>
          !tartarDataFetching ? "" : item.value === tartarDataFetching["11n"],
        ),
        teethRight3: optionsRight.find((item) =>
          !tartarDataFetching
            ? ""
            : item.value === tartarDataFetching["26-27n"],
        ),
        teethRight4: optionsRight.find((item) =>
          !tartarDataFetching
            ? ""
            : item.value === tartarDataFetching["47-46t"],
        ),
        teethRight5: optionsRight.find((item) =>
          !tartarDataFetching ? "" : item.value === tartarDataFetching["31n"],
        ),
        teethRight6: optionsRight.find((item) =>
          !tartarDataFetching
            ? ""
            : item.value === tartarDataFetching["36-37t"],
        ),
      });
    }, [selectedExam, plaqueDataFetching, tartarDataFetching]);

    React.useImperativeHandle(ref, () => formik.values);

    return (
      <div className="flex flex-col gap-6 p-4">
        <div className="w-full">
          <div className="flex flex-col">
            <h2 className="mb-4 text-left text-lg font-bold">
              a. PI(chỉ số mảng bám)
            </h2>
            <div className="mb-4 flex justify-between">
              <div className="mx-2 w-1/3">
                <Select
                  // name="17-16N"
                  label="17-16N"
                  options={optionsLeft}
                  value={formik.values.teethLeft1}
                  onChange={(value) => {
                    formik.setFieldValue("teethLeft1", value);
                  }}
                  getOptionLabel={(option) => option.label}
                />
              </div>
              <div className="mx-2 w-1/3">
                <Select
                  label="11N"
                  options={optionsLeft}
                  value={formik.values.teethLeft2}
                  onChange={(value) =>
                    formik.setFieldValue("teethLeft2", value)
                  }
                />
              </div>
              <div className="mx-2 w-1/3">
                <Select
                  label="26-27N"
                  options={optionsLeft}
                  value={formik.values.teethLeft3}
                  onChange={(value) =>
                    formik.setFieldValue("teethLeft3", value)
                  }
                />
              </div>
            </div>
            <div className="flex justify-between">
              <div className="mx-2 w-1/3">
                <Select
                  label="47-46T"
                  options={optionsLeft}
                  value={formik.values.teethLeft4}
                  onChange={(value) =>
                    formik.setFieldValue("teethLeft4", value)
                  }
                />
              </div>
              <div className="mx-2 w-1/3">
                <Select
                  label="31N"
                  options={optionsLeft}
                  value={formik.values.teethLeft5}
                  onChange={(value) =>
                    formik.setFieldValue("teethLeft5", value)
                  }
                />
              </div>
              <div className="mx-2 w-1/3">
                <Select
                  label="36-37T"
                  options={optionsLeft}
                  value={formik.values.teethLeft6}
                  onChange={(value) =>
                    formik.setFieldValue("teethLeft6", value)
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="flex flex-col">
            <h2 className="mb-4 text-left text-lg font-bold">
              b. CI (chỉ số vôi răng)
            </h2>
            <div className="mb-4 flex justify-between">
              <div className="mx-2 w-1/3">
                <Select
                  label="17-16N"
                  options={optionsRight}
                  value={formik.values.teethRight1}
                  onChange={(value) =>
                    formik.setFieldValue("teethRight1", value)
                  }
                />
              </div>
              <div className="mx-2 w-1/3">
                <Select
                  label="11N"
                  options={optionsRight}
                  value={formik.values.teethRight2}
                  onChange={(value) =>
                    formik.setFieldValue("teethRight2", value)
                  }
                />
              </div>
              <div className="mx-2 w-1/3">
                <Select
                  label="26-27N"
                  options={optionsRight}
                  value={formik.values.teethRight3}
                  onChange={(value) =>
                    formik.setFieldValue("teethRight3", value)
                  }
                />
              </div>
            </div>
            <div className="flex justify-between">
              <div className="mx-2 w-1/3">
                <Select
                  label="47-46T"
                  options={optionsRight}
                  value={formik.values.teethRight4}
                  onChange={(value) =>
                    formik.setFieldValue("teethRight4", value)
                  }
                />
              </div>
              <div className="mx-2 w-1/3">
                <Select
                  label="31N"
                  options={optionsRight}
                  value={formik.values.teethRight5}
                  onChange={(value) =>
                    formik.setFieldValue("teethRight5", value)
                  }
                />
              </div>
              <div className="mx-2 w-1/3">
                <Select
                  label="36-37T"
                  options={optionsRight}
                  value={formik.values.teethRight6}
                  onChange={(value) =>
                    formik.setFieldValue("teethRight6", value)
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default TeethOverall;
