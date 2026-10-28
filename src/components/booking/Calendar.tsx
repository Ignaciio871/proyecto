import type { Dispatch, SetStateAction } from 'react';
import { dayNames, monthNames } from '@/lib/constants';
import { formatInputDate, getMonthDays } from '@/lib/utils';

interface CalendarProps {
  month:     Date;
  setMonth:  Dispatch<SetStateAction<Date>>;
  selected:  string;
  onSelect:  (fecha: string) => void;
}

// ─────────────────────────────────────────────────────────
//  CALENDARIO
// ─────────────────────────────────────────────────────────
export const Calendar = ({ month, setMonth, selected, onSelect }: CalendarProps) => {
  const today = new Date();
  const cells = getMonthDays(month);
  return (
    <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900">{monthNames[month.getMonth()]} {month.getFullYear()}</span>
        <div className="flex gap-1">
          <button type="button" onClick={() => setMonth(d => new Date(d.getFullYear(), d.getMonth()-1,1))}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm hover:border-farmacia hover:text-farmacia">‹</button>
          <button type="button" onClick={() => setMonth(d => new Date(d.getFullYear(), d.getMonth()+1,1))}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm hover:border-farmacia hover:text-farmacia">›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
        {dayNames.map(d => <span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-sm">
        {cells.map((day, i) => {
          const sel  = day && selected === formatInputDate(day);
          const past = day && new Date(formatInputDate(day)) < new Date(formatInputDate(today));
          return (
            <button key={i} type="button" disabled={!day || !!past}
              onClick={() => day && onSelect(formatInputDate(day))}
              className={`rounded-xl border py-1.5 transition ${!day ? 'border-transparent' : past ? 'border-transparent text-slate-300 cursor-not-allowed' : sel ? 'border-farmacia bg-farmacia text-white' : 'border-slate-200 bg-slate-50 hover:border-farmacia hover:bg-farmacia/10'}`}>
              {day ? day.getDate() : ''}
            </button>
          );
        })}
      </div>
      <input type="date" value={selected} min={formatInputDate(today)}
        onChange={e => onSelect(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-farmacia focus:ring-2 focus:ring-farmacia/20" />
    </div>
  );
};
