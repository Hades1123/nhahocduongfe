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
  defaultChecked,
  checked,
}: Props) => {
  // Build props conditionally to avoid passing both checked and defaultChecked
  // if they aren't explicitly provided by the parent.
  const inputProps: any = {};
  if (checked !== undefined) inputProps.checked = checked;
  if (defaultChecked !== undefined) inputProps.defaultChecked = defaultChecked;

  return (
    <div className="flex items-center">
      <input
        id={id}
        name={name}
        value={value}
        type="radio"
        onClick={onClick}
        onChange={onClick || (() => {})} // Prevents the read-only warning
        {...inputProps}
        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
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
