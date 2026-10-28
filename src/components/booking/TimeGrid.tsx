import { timeSlots } from '@/lib/constants';

interface TimeGridProps {
  bookedSlots: string[];
  selected:    string;
  onSelect:    (slot: string) => void;
}

export const TimeGrid = ({ bookedSlots, selected, onSelect }: TimeGridProps) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-900">Horarios disponibles</p>
        <p className="text-xs text-slate-500">Los horarios en rojo ya están reservados.</p>
      </div>
      <div className="space-y-1 text-right text-xs text-slate-500">
        <p><span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 mr-1" />Libre</p>
        <p><span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-400 mr-1" />Ocupado</p>
      </div>
    </div>
    <div className="grid gap-2 sm:grid-cols-3">
      {timeSlots.map(slot => {
        const occ = bookedSlots.includes(slot);
        const sel = selected === slot;
        return (
          <button key={slot} type="button" onClick={() => onSelect(slot)} disabled={occ}
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${occ ? 'border-rose-200 bg-rose-50 text-rose-700 cursor-not-allowed' : sel ? 'border-farmacia bg-farmacia text-white' : 'border-slate-200 bg-slate-50 text-slate-900 hover:border-farmacia hover:bg-farmacia/10'}`}>
            {slot}
          </button>
        );
      })}
    </div>
  </div>
);
