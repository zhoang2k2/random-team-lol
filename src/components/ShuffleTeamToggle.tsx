import { ToggleRow } from "@/components/ToggleRow";

type ShuffleTeamToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

export const ShuffleTeamToggle = ({ value, onChange, disabled }: ShuffleTeamToggleProps) => {
  return (
    <ToggleRow
      label="Shuffle team"
      hint="Bạn sợ à?"
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
};
