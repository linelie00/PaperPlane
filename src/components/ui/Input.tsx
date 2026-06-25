import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const fieldBase =
  "w-full rounded-2xl border border-paper-border bg-white px-4 py-3 text-ink-main outline-none transition placeholder:text-ink-muted focus:border-plane-primary focus:ring-4 focus:ring-plane-light/40";

type FieldWrapperProps = {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
};

export function Field({ label, htmlFor, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink-sub">
        {label}
      </label>
      {children}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input className={`${fieldBase} ${className}`} {...rest} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return <textarea className={`${fieldBase} resize-y ${className}`} {...rest} />;
}
