import { icons } from './icons';
import { statusPalette } from '@/lib/constants';
import { formatFriendlyDate } from '@/lib/utils';
import type { Turno } from '@/lib/types';

interface TurnoCardProps {
  turno:         Turno;
  showUser?:     boolean;
  currentUid?:   string;
  canConfirm?:   boolean;
  onCancel:      (turno: Turno) => void;
  onConfirm:     (turno: Turno) => void;
  onReschedule?: (turno: Turno) => void;
}

// ─────────────────────────────────────────────────────────
//  TARJETA DE TURNO
// ─────────────────────────────────────────────────────────
export const TurnoCard = ({ turno, showUser = false, currentUid, canConfirm = false, onCancel, onConfirm, onReschedule }: TurnoCardProps) => (
  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 fade-in-up">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900">{turno.servicio}</p>
        <p className="text-sm text-slate-600">{formatFriendlyDate(turno.fecha)} · {turno.horario}</p>
        {showUser && <p className="text-xs text-slate-400">{turno.usuario_nombre || turno.usuario_email}</p>}
      </div>
      <span className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${statusPalette[turno.estado] || 'bg-slate-100 text-slate-700'}`}>{turno.estado}</span>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      {turno.estado !== 'Cancelado' &&
        <button type="button" onClick={() => onCancel(turno)}
          className="flex items-center gap-1.5 rounded-2xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 transition">
          {icons.trash} Cancelar
        </button>
      }
      {onReschedule && turno.estado === 'Pendiente' && turno.usuario_id === currentUid &&
        <button type="button" onClick={() => onReschedule(turno)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-farmacia hover:text-farmacia transition">
          Reprogramar
        </button>
      }
      {canConfirm && turno.estado === 'Pendiente' &&
        <button type="button" onClick={() => onConfirm(turno)}
          className="flex items-center gap-1.5 rounded-2xl bg-farmacia px-4 py-2 text-xs font-semibold text-white hover:bg-farmacia/90 transition">
          {icons.check} Confirmar
        </button>
      }
    </div>
  </div>
);
