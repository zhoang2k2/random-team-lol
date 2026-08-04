import { cn } from "@/lib/utils";

type TextInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const TextInput = ({ className, ...props }: TextInputProps) => {
  return (
    <input
      className={cn(
        "input-hex w-full h-10 px-3 text-sm text-gold-bright placeholder:text-muted-foreground/60 bg-background/40 border border-gold/30 focus:outline-none focus:border-gold transition-colors",
        className,
      )}
      {...props}
    />
  );
};
