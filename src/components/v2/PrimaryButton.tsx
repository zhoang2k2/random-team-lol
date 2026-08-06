import { cn } from "@/lib/utils";

type PrimaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "default" | "danger";
  size?: "sm" | "md" | "lg";
};

export const PrimaryButton = ({
  variant = "default",
  size = "md",
  className,
  children,
  ...props
}: PrimaryButtonProps) => {
  return (
    <button
      type="button"
      className={cn(
        "btn-hex cursor-pointer",
        variant === "primary" && "btn-hex-primary",
        variant === "danger" && "btn-hex-danger",
        size === "sm" && "text-[10px] px-3 py-1",
        size === "md" && "text-xs px-4 py-2",
        size === "lg" && "text-sm px-5 py-3",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};
