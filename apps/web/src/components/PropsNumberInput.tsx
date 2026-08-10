import { useEffect, useState, type KeyboardEvent } from "react";
import {
  formatPropsNumber,
  isIncompleteNumberDraft,
  parsePropsNumberDraft,
  type PropsNumberCommitOpts,
} from "./propsNumberCommit";

type PropsNumberInputProps = {
  value: number;
  onCommit: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  /** Default true. Set false only if 0 is a valid committed value. */
  requirePositive?: boolean;
};

/**
 * Controlled-by-document number field with a local draft while typing.
 * Commits on blur / Enter; spinners commit when the draft is a complete valid number.
 */
export function PropsNumberInput({
  value,
  onCommit,
  min,
  max,
  step,
  className = "props__input",
  requirePositive = true,
}: PropsNumberInputProps) {
  const opts: PropsNumberCommitOpts = { min, max, requirePositive };
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(() => formatPropsNumber(value));

  useEffect(() => {
    if (!focused) setDraft(formatPropsNumber(value));
  }, [value, focused]);

  const commitDraft = (raw: string): boolean => {
    const parsed = parsePropsNumberDraft(raw, opts);
    if (parsed == null) {
      setDraft(formatPropsNumber(value));
      return false;
    }
    onCommit(parsed);
    setDraft(formatPropsNumber(parsed));
    return true;
  };

  return (
    <input
      className={className}
      type="number"
      min={min}
      max={max}
      step={step}
      value={draft}
      onFocus={() => setFocused(true)}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        // Spinners and complete keystrokes: commit without waiting for blur.
        if (!isIncompleteNumberDraft(raw)) {
          const parsed = parsePropsNumberDraft(raw, opts);
          if (parsed != null) onCommit(parsed);
        }
      }}
      onBlur={() => {
        setFocused(false);
        commitDraft(draft);
      }}
      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (commitDraft(draft)) e.currentTarget.blur();
          else e.currentTarget.blur();
        } else if (e.key === "Escape") {
          e.preventDefault();
          setDraft(formatPropsNumber(value));
          e.currentTarget.blur();
        }
      }}
    />
  );
}
