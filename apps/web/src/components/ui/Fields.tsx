import { useId, type ComponentPropsWithoutRef } from 'react';
import { cx } from './cx';

const control =
  'rounded-card border border-line bg-surface px-3 py-2 text-base text-ink disabled:opacity-50';

interface FieldProps {
  label: string;
}

export function TextField({
  label,
  className,
  id,
  ...rest
}: ComponentPropsWithoutRef<'input'> & FieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-sm font-semibold">
        {label}
      </label>
      <input id={fieldId} className={cx(control, className)} {...rest} />
    </div>
  );
}

export function SelectField({
  label,
  className,
  id,
  ...rest
}: ComponentPropsWithoutRef<'select'> & FieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-sm font-semibold">
        {label}
      </label>
      <select id={fieldId} className={cx(control, className)} {...rest} />
    </div>
  );
}
