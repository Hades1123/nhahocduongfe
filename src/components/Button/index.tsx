import { twMerge } from "tailwind-merge";

type Variants = "contained" | "outlined";
interface ButtonProps {
  children?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  variants?: Variants;
  type?: "submit" | "reset" | "button" | undefined;
  className?: string;
  isDisabled?: boolean;
}
const Button = ({
  onClick,
  children,
  variants = "contained",
  type = "button",
  className,
  isDisabled = false,
}: ButtonProps) => {
  const buttonClasses = twMerge(
    "rounded-md px-3 py-2 text-sm font-semibold shadow-sm whitespace-nowrap",
    variants === "contained" &&
      "bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
    variants === "outlined" &&
      "bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50",
    isDisabled === true && "bg-gray-300 pointer-events-none",
  );

  return (
    <button
      onClick={onClick}
      type={type}
      className={twMerge(buttonClasses, className)}
      disabled={isDisabled}
    >
      {children}
    </button>
  );
};
export default Button;
