import { twMerge } from "tailwind-merge";

interface CardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
}
const Card = ({ children, header, className }: CardProps) => {
  return (
    /* theme-card-bg + theme-card-border: hook classes for custom palette.
       Default: bg-white + divide-gray-200 (Tailwind defaults).
       Custom theme active: var(--theme-neutral) bg + var(--theme-accent) border. */
    <div className="divide-y divide-gray-200 dark:divide-slate-700 rounded-lg bg-white dark:bg-slate-800 shadow dark:text-slate-100 theme-card-bg theme-card-border">
      {header && (
        <h1 className="px-4 py-5 text-lg font-bold sm:px-6">{header}</h1>
      )}
      <div className={twMerge("px-4 py-5 sm:p-6", className)}>{children}</div>
    </div>
  );
};
export default Card;
