import type { ChangeEvent, ReactNode } from 'react';

interface InputFieldProps {
  label:        string;
  name:         string;
  value:        string;
  icon?:        ReactNode;
  type?:        string;
  placeholder?: string;
  error?:       string;
  onChange:     (e: ChangeEvent<HTMLInputElement>) => void;
}

export const InputField = ({ label, name, value, icon, type='text', placeholder, error, onChange }: InputFieldProps) => (
  <label className="block">
    <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
    <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${error ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 bg-white'} focus-within:border-farmacia focus-within:ring-2 focus-within:ring-farmacia/20`}>
      {icon}
      <input name={name} type={type} value={value} placeholder={placeholder} onChange={onChange}
        className="w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400" />
    </div>
    {error ? <p className="mt-1.5 text-xs text-rose-600">{error}</p> : null}
  </label>
);
