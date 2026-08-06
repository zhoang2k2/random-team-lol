import { cn } from "@/lib/utils";

type NumberInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "min" | "max"> & {
  min?: number;
  max?: number;
};

export const NumberInput = ({
  className,
  min = 0.5,
  max = 10,
  ...props
}: NumberInputProps) => {
  return (
    <input
      type="number"
      min={min}
      max={max}
      className={cn(
        "w-full h-9 px-3 text-sm text-gold-bright bg-background/40 border border-gold/30",
        "focus:outline-none focus:border-gold transition-colors",
        "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        "placeholder:text-muted-foreground/60",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
};
