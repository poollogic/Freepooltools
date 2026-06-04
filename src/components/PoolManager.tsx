import { useEffect, useRef, useState } from 'react';
import { X, Plus, Trash2, Pencil, Check, Download, Upload, Droplet, Waves } from 'lucide-react';
import {
  usePools,
  useActiveId,
  setActivePool,
  createPool,
  updatePool,
  deletePool,
  exportPools,
  importPools,
} from '@/lib/poolProfile';

/**
 * "My Pools" manager — lazy-loaded (see Navbar), so its code only downloads when
 * a technician opens it; it's never part of the calculator/critical bundle.
 * Pure localStorage: list, save, switch the active pool, rename/delete, and
 * export/import for backup. Selecting a pool makes it "active", which every
 * calculator prefills from on its next load.
 */
const fieldClass =
  'w-full rounded-lg border border-line bg-card-2 px-3 py-2 text-fg text-sm placeholder-subtle focus:outline-none focus:border-brand-blue/60 focus:ring-2 focus:ring-brand-blue/30 transition';

const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

export const PoolManager = ({ onClose }: { onClose: () => void }) => {
  const pools = usePools();
  const activeId = useActiveId();

  const [name, setName] = useState('');
  const [vol, setVol] = useState('');
  const [cya, setCya] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eName, setEName] = useState('');
  const [eVol, setEVol] = useState('');
  const [eCya, setECya] = useState('');
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const add = () => {
    const label = name.trim();
    if (!label) {
      setMsg('Give the pool a name or address.');
      return;
    }
    createPool({ name: label, volumeGal: num(vol), cya: num(cya) });
    setName('');
    setVol('');
    setCya('');
    setMsg('');
  };

  const startEdit = (id: string) => {
    const p = pools.find((x) => x.id === id);
    if (!p) return;
    setEditingId(id);
    setEName(p.name);
    setEVol(p.volumeGal != null ? String(p.volumeGal) : '');
    setECya(p.cya != null ? String(p.cya) : '');
  };

  const saveEdit = () => {
    if (!editingId) return;
    updatePool(editingId, { name: eName.trim() || 'Pool', volumeGal: num(eVol), cya: num(eCya) });
    setEditingId(null);
  };

  const doExport = () => {
    const blob = new Blob([exportPools()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-pools.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const n = importPools(String(reader.result));
        setMsg(`Imported ${n} pool${n === 1 ? '' : 's'}.`);
      } catch {
        setMsg('Could not read that file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="My pools"
        className="w-full max-w-lg mt-16 sm:mt-0 max-h-[85vh] flex flex-col rounded-2xl border border-line bg-[var(--popover-bg)] backdrop-blur-[12px] shadow-2xl shadow-black/40 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="font-display font-bold text-fg text-lg flex items-center gap-2">
            <Waves className="w-5 h-5 text-brand-blue-light" />
            My Pools
            {pools.length > 0 && <span className="text-subtle font-normal text-sm">({pools.length})</span>}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-subtle hover:text-fg hover:bg-card-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4">
          {/* Add a pool */}
          <div className="rounded-xl border border-line bg-card-2 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-subtle mb-2">Save a pool</p>
            <input
              className={`${fieldClass} mb-2`}
              placeholder="Name or address (e.g. 14 Lakeshore Dr)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
            />
            <div className="flex gap-2">
              <input className={fieldClass} inputMode="decimal" placeholder="Volume (gal)" value={vol} onChange={(e) => setVol(e.target.value)} />
              <input className={fieldClass} inputMode="decimal" placeholder="CYA (ppm)" value={cya} onChange={(e) => setCya(e.target.value)} />
              <button
                type="button"
                onClick={add}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-brand-orange px-3 py-2 text-sm font-semibold text-white hover:bg-brand-orange-dark transition-colors"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          {/* List */}
          {pools.length === 0 ? (
            <p className="text-sm text-subtle text-center py-6">
              No saved pools yet. Add one above — or use the “Save this pool” button on any calculator.
            </p>
          ) : (
            <ul className="space-y-2">
              {pools.map((p) => {
                const isActive = p.id === activeId;
                const isEditing = p.id === editingId;
                return (
                  <li key={p.id} className={`rounded-xl border p-3 ${isActive ? 'border-brand-orange/40 bg-brand-orange/[0.06]' : 'border-line bg-card'}`}>
                    {isEditing ? (
                      <div className="space-y-2">
                        <input className={fieldClass} value={eName} onChange={(e) => setEName(e.target.value)} placeholder="Name or address" />
                        <div className="flex gap-2">
                          <input className={fieldClass} inputMode="decimal" value={eVol} onChange={(e) => setEVol(e.target.value)} placeholder="Volume (gal)" />
                          <input className={fieldClass} inputMode="decimal" value={eCya} onChange={(e) => setECya(e.target.value)} placeholder="CYA (ppm)" />
                          <button type="button" onClick={saveEdit} aria-label="Save changes" className="shrink-0 inline-flex items-center justify-center w-9 rounded-lg bg-brand-blue text-white hover:bg-brand-blue-dark transition-colors">
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Droplet className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-orange' : 'text-brand-blue-light'}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-fg font-semibold text-sm truncate">{p.name}</p>
                          <p className="text-subtle text-xs tabular-nums">
                            {p.volumeGal != null ? `${p.volumeGal.toLocaleString()} gal` : 'no volume'}
                            {p.cya != null ? ` · CYA ${p.cya}` : ''}
                          </p>
                        </div>
                        {isActive ? (
                          <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-brand-orange">In use</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActivePool(p.id)}
                            className="shrink-0 rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-muted hover:text-fg hover:bg-card-2 transition-colors"
                          >
                            Use
                          </button>
                        )}
                        <button type="button" onClick={() => startEdit(p.id)} aria-label={`Edit ${p.name}`} className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg text-subtle hover:text-fg hover:bg-card-2 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => deletePool(p.id)} aria-label={`Delete ${p.name}`} className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg text-subtle hover:text-red-400 hover:bg-card-2 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {msg && <p className="text-xs text-brand-blue-light">{msg}</p>}
        </div>

        {/* Footer: backup */}
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-line">
          <p className="text-[11px] text-subtle leading-snug">Saved on this device. Export to back up or move to another phone.</p>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={doExport} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-muted hover:text-fg hover:bg-card-2 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-muted hover:text-fg hover:bg-card-2 transition-colors">
              <Upload className="w-3.5 h-3.5" /> Import
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) doImport(f);
                e.target.value = '';
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoolManager;
