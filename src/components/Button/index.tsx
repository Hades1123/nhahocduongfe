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
  /*
   * theme-button-bg + theme-button-hover + theme-button-focus:
   * Hook classes for the contained button variant.
   * Default: bg-indigo-600 + hover:bg-indigo-500 (Tailwind defaults).
   * Custom theme active: var(--theme-primary) + var(--theme-secondary) hover.
   * Only applied to "contained" variant — "outlined" stays as-is.
   */
    const buttonClasses = twMerge(
    "rounded-md px-3 py-2 text-sm font-semibold shadow-sm whitespace-nowrap",
    variants === "contained" &&
      "bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 theme-button-bg theme-button-hover theme-button-focus",
    variants === "outlined" &&
      "bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-transparent dark:text-slate-100 dark:ring-slate-600 dark:hover:bg-slate-800",
    isDisabled === true && "bg-gray-300 pointer-events-none dark:bg-slate-700 dark:text-slate-500",
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
