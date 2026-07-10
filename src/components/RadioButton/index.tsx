interface Props {
  id?: string;
  label?: string;
  name: string;
  value?: any;
  onClick?: (e: any) => void;
  error?: string;
  defaultChecked?: boolean;
  checked?: boolean;
}
const RadioButton = ({
  id,
  label,
  name,
  value,
  onClick,
  error,
  defaultChecked = false,
  checked = false,
}: Props) => {
  return (
    <div className="flex items-center">
      <input
        id={id}
        name={name}
        value={value}
        type="radio"
        onClick={onClick}
        defaultChecked={defaultChecked}
        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
        checked={checked}
      />
      <label
        htmlFor={id}
        className="ml-3 block text-sm font-semibold leading-6 text-gray-900 dark:text-slate-100"
      >
        {label}
      </label>
    </div>
  );
};
export default RadioButton;
