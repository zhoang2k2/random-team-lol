import { ToggleRow } from "@/components/ToggleRow";

type EvaluatePowerToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

export const EvaluatePowerToggle = ({
  value,
  onChange,
  disabled = false,
}: EvaluatePowerToggleProps) => {
  return (
    <ToggleRow
      label="Evaluate Power"
      hint="Chấm điểm từng summoner để cân bằng team."
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
};
