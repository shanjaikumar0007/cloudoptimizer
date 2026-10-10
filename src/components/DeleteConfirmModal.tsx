import React from 'react';
import { Resource } from '../types';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  resource: Resource | null;
  onClose: () => void;
  onConfirm: (resourceId: string) => Promise<void>;
  loading: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  resource,
  onClose,
  onConfirm,
  loading,
}) => {
  if (!isOpen || !resource) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-lg shadow-2xl p-6">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-full bg-rose-950/60 border border-rose-800/80 flex items-center justify-center text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4">
          <h3 className="text-base font-semibold text-white">Decommission Resource</h3>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            Are you sure you want to delete <span className="text-white font-mono font-semibold">{resource.resource_id}</span> ({resource.name}) from cloud monitoring?
          </p>

          <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded text-xs space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Provider & Region:</span>
              <span className="text-slate-200">{resource.provider} / {resource.region}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Current Hourly Rate:</span>
              <span className="text-slate-200 font-mono">${resource.hourly_cost.toFixed(2)}/hr</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Monthly Cost:</span>
              <span className="text-slate-200 font-mono">${(resource.hourly_cost * 730).toFixed(2)}/mo</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(resource.resource_id)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{loading ? 'Deleting...' : 'Confirm Deletion'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
