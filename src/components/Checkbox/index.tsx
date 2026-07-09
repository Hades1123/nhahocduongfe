interface Props {
  label?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  checked?: boolean;
  value?: string;
  id?: string;
}
const Checkbox = ({
  label = "",
  onChange,
  name = "checkbox",
  value = "",
  checked,
  id,
}: Props) => {
  return (
    <div className="relative flex items-start">
      <div className="flex h-6 items-center">
        <input
          value={value}
          id={id}
          checked={checked}
          name={name}
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
          onChange={onChange}
        />
      </div>
      <div className="ml-3 text-sm leading-6">
        <label htmlFor={id} className="font-medium text-gray-900 dark:text-slate-100">
          {label}
        </label>
      </div>
    </div>
  );
};
export default Checkbox;
