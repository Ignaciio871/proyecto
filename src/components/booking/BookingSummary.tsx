import { formatFriendlyDate } from '@/lib/utils';
import type { BookingData } from '@/lib/types';

interface BookingSummaryProps {
  data:      BookingData;
  loading:   boolean;
  editing:   boolean;
  onBack:    () => void;
  onConfirm: () => void;
}

export const BookingSummary = ({ data, loading, editing, onBack, onConfirm }: BookingSummaryProps) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <p className="mb-4 text-sm font-semibold text-slate-900">Confirmá tu turno</p>
    <div className="mb-5 grid gap-4 sm:grid-cols-3">
      {[['Servicio',data.servicio],['Fecha',formatFriendlyDate(data.fecha)],['Horario',data.horario]].map(([k,v]) => (
        <div key={k} className="rounded-3xl border border-slate-200 bg-fondo p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">{k}</p>
          <p className="mt-2 font-semibold text-slate-900">{v}</p>
        </div>
      ))}
    </div>
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
      <button type="button" onClick={onBack}
        className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-farmacia hover:text-farmacia transition">
        Cambiar horario
      </button>
      <button type="button" onClick={onConfirm} disabled={loading}
        className="rounded-2xl bg-farmacia px-5 py-3 text-sm font-semibold text-white transition hover:bg-farmacia/90 disabled:opacity-60">
        {loading ? 'Guardando…' : editing ? 'Reprogramar turno' : 'Confirmar turno'}
      </button>
    </div>
  </div>
);
