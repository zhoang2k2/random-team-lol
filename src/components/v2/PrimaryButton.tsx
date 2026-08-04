import { cn } from "@/lib/utils";

type PrimaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "default" | "danger";
};

export const PrimaryButton = ({
  variant = "default",
  className,
  children,
  ...props
}: PrimaryButtonProps) => {
  return (
    <button
      type="button"
      className={cn(
        "btn-hex font-display uppercase tracking-widest text-sm px-4 h-10 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed",
        variant === "primary" && "btn-hex-primary shadow-[0_0_15px_rgba(255,215,0,0.1)] hover:shadow-[0_0_25px_rgba(255,215,0,0.35)]",
        variant === "danger" && "border-destructive/50 text-destructive hover:bg-destructive/10",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};
