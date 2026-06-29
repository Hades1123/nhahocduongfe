import { useEffect, useState } from "react";
import Tooth from "../Tooth";
import ToothModal from "../ToothModalForm";
import { api } from "@/api/api";
import { useQuery } from "react-query";
import React from "react";
import { useLocation } from "react-router-dom";
interface Props {
  selectedTreatment?: any;
  onChange?: (value: any) => void;
}

const mappingValue = (value: any) => {
  const compactData = {
    problem: value.problem?.value,
    // treatment: value.treatment?.value,
    locations: value.locations?.map((item: any) => item.value),
  };

  return compactData;
};

const greenColor = [0, 3, 6, 7];
const redColor = [1, 2, 4, 5, 9];
const yellowColor = [8];

const Odontogram = React.forwardRef<any, any>(
  ({ selectedTreatment, onChange }: Props, ref) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [selectedTooth, setSelectedTooth] = useState<number>();
    const [values, setValues] = useState({});
    const [highlightTeeth, setHighlightTeeth] = useState<any>([]);
    const [colourTooth, setColourTooth] = useState<any>();

    const url = useLocation().pathname.split("/");

    React.useImperativeHandle(ref, () => values as any);

    useEffect(() => {
      onChange && onChange(values);
    }, [values]);

    const {
      data = [],
      isLoading,
      error,
    } = useQuery(
      `getTeethRecord/${selectedTreatment}`,
      () =>
        api
          .get(
            `/api/patients/${
              url[url.length - 2]
            }/exams/${selectedTreatment}/teethRecord`,
          )
          .then((response) => response.data.record),
      {
        enabled: !!selectedTreatment,
        refetchOnWindowFocus: false,
        retry: false,
      },
    );

    const handleOnToothClick = (toothNumber: number) => {
      setSelectedTooth(toothNumber);
      setIsOpen(true);
    };

    useEffect(() => {
      if (Object.keys(values).length > 0) {
        setHighlightTeeth(Object.keys(values));
        setColourTooth(Object.entries(values));
      }
    }, [values]);

    useEffect(() => {
      if (Object.keys(data).length > 0) {
        setHighlightTeeth(Object.keys(data));
      }
    }, [data]);

    const checkTeethProblem = (toothNumbers: any) => {
      return toothNumbers.map((toothNumber: any) => {
        const tooth = colourTooth?.find((item: any) => item[0] === toothNumber);
        if (tooth) {
          const problem = tooth[1].problem;
          if (greenColor.includes(parseInt(problem))) {
            return [tooth[0], "green"];
          } else if (redColor.includes(parseInt(problem))) {
            return [tooth[0], "red"];
          } else if (yellowColor.includes(parseInt(problem))) {
            return [tooth[0], "yellow"];
          } else {
            return "unknown";
          }
        } else {
          return "not_found";
        }
      });
    };

    const toothNumbers = highlightTeeth;
    const results = checkTeethProblem(toothNumbers);

    const teethDiagram = {
      topLeft: {
        babyTeeth: [61, 62, 63, 64, 65],
        permanentTeeth: [21, 22, 23, 24, 25, 26, 27, 28],
      },
      bottomLeft: {
        babyTeeth: [71, 72, 73, 74, 75],
        permanentTeeth: [31, 32, 33, 34, 35, 36, 37, 38],
      },
      topRight: {
        babyTeeth: [51, 52, 53, 54, 55],
        permanentTeeth: [11, 12, 13, 14, 15, 16, 17, 18],
      },
      bottomRight: {
        babyTeeth: [81, 82, 83, 84, 85],
        permanentTeeth: [41, 42, 43, 44, 45, 46, 47, 48],
      },
    };

    const BABY_TEETH_LENGTH = 5;

    const teethRecordData = data;

    useEffect(() => {
      if (selectedTreatment) {
        setValues(teethRecordData);
      }
    }, [selectedTreatment, teethRecordData]);

    const handleUpdateTeethStatus = (value: any, selectedTooth: any) => {
      const data = mappingValue(value);
      const tempValue = { ...teethRecordData, ...values } as any;
      tempValue[selectedTooth] = data;

      setValues(tempValue);
    };

    if (error) return <div>Error...</div>;

    return (
      <>
        {isOpen && (
          <ToothModal
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            toothNumber={selectedTooth}
            value={Object.assign({}, data, values)[String(selectedTooth)]}
            onSubmit={(value) => handleUpdateTeethStatus(value, selectedTooth)}
          />
        )}
        <div className="relative grid grid-cols-2 grid-rows-4 gap-6 p-14">
          <p className="absolute left-0 top-0 text-base font-bold text-gray-600">
            Hàm trên phải
          </p>
          <p className="absolute right-0 top-0 text-base font-bold text-gray-600">
            Hàm trên trái
          </p>
          <p className="absolute bottom-0 right-0 text-base font-bold text-gray-600">
            Hàm dưới trái
          </p>
          <p className="absolute bottom-0 left-0 text-base font-bold text-gray-600">
            Hàm dưới phải
          </p>
          <div className="flex flex-row-reverse gap-8">
            {teethDiagram.topRight.permanentTeeth.map((tooth: any, index) => (
              <Tooth
                key={index}
                position={tooth}
                // isHighlight={highlightTeeth.includes(String(tooth))}
                onClick={() => handleOnToothClick(tooth)}
                type={index - BABY_TEETH_LENGTH}
                colour={results?.find((item: any) =>
                  item.includes(String(tooth)),
                )}
              />
            ))}
          </div>
          <div className="flex justify-start gap-8">
            {teethDiagram.topLeft.permanentTeeth.map((tooth, index) => (
              <Tooth
                key={index}
                position={tooth}
                onClick={() => handleOnToothClick(tooth)}
                isHighlight={highlightTeeth.includes(String(tooth))}
                type={index - BABY_TEETH_LENGTH}
                colour={results?.find((item: any) =>
                  item.includes(String(tooth)),
                )}
              />
            ))}
          </div>
          <div className="flex flex-row-reverse gap-8">
            {teethDiagram.topRight.babyTeeth.map((tooth, index) => (
              <Tooth
                key={index}
                position={tooth}
                onClick={() => handleOnToothClick(tooth)}
                isHighlight={highlightTeeth.includes(String(tooth))}
                colour={results?.find((item: any) =>
                  item.includes(String(tooth)),
                )}
              />
            ))}
          </div>
          <div className="flex justify-start gap-8">
            {teethDiagram.topLeft.babyTeeth.map((tooth, index) => (
              <Tooth
                key={index}
                position={tooth}
                onClick={() => handleOnToothClick(tooth)}
                isHighlight={highlightTeeth.includes(String(tooth))}
                colour={results?.find((item: any) =>
                  item.includes(String(tooth)),
                )}
              />
            ))}
          </div>
          <div className="flex flex-row-reverse gap-8">
            {teethDiagram.bottomRight.babyTeeth.map((tooth, index) => (
              <Tooth
                key={index}
                position={tooth}
                onClick={() => handleOnToothClick(tooth)}
                isHighlight={highlightTeeth.includes(String(tooth))}
                colour={results?.find((item: any) =>
                  item.includes(String(tooth)),
                )}
                type={index - BABY_TEETH_LENGTH}
              />
            ))}
          </div>
          <div className="flex justify-start gap-8">
            {teethDiagram.bottomLeft.babyTeeth.map((tooth, index) => (
              <Tooth
                key={index}
                position={tooth}
                onClick={() => handleOnToothClick(tooth)}
                isHighlight={highlightTeeth.includes(String(tooth))}
                colour={results?.find((item: any) =>
                  item.includes(String(tooth)),
                )}
              />
            ))}
          </div>
          <div className="flex flex-row-reverse gap-8">
            {teethDiagram.bottomRight.permanentTeeth.map((tooth, index) => (
              <Tooth
                key={index}
                position={tooth}
                onClick={() => handleOnToothClick(tooth)}
                isHighlight={highlightTeeth.includes(String(tooth))}
                colour={results?.find((item: any) =>
                  item.includes(String(tooth)),
                )}
                type={index - BABY_TEETH_LENGTH}
              />
            ))}
          </div>
          <div className="flex justify-start gap-8">
            {teethDiagram.bottomLeft.permanentTeeth.map((tooth, index) => (
              <Tooth
                key={index}
                position={tooth}
                onClick={() => handleOnToothClick(tooth)}
                isHighlight={highlightTeeth.includes(String(tooth))}
                type={index - BABY_TEETH_LENGTH}
                colour={results?.find((item: any) =>
                  item.includes(String(tooth)),
                )}
              />
            ))}
          </div>

          <div className="absolute left-1/2 top-1/2 h-[1px] w-[90%] -translate-x-1/2 border border-slate-400"></div>
          <div className="absolute left-1/2 h-full w-[1px] border border-slate-400"></div>
        </div>
      </>
    );
  },
);
export default Odontogram;
