import React, { useState, useEffect } from 'react';
import { Resource, ResourceFormData } from '../types';
import { X } from 'lucide-react';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ResourceFormData, isEdit: boolean) => Promise<void>;
  editResource?: Resource | null;
}

export const AddResourceModal: React.FC<AddResourceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editResource,
}) => {
  const [formData, setFormData] = useState<ResourceFormData>({
    resource_id: '',
    name: '',
    type: 'VM',
    provider: 'AWS',
    region: 'us-east-1',
    cpu_utilization: 10,
    memory_utilization: 15,
    storage_utilization: 12,
    network_utilization: 8,
    hourly_cost: 0.15,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editResource) {
      setFormData({
        resource_id: editResource.resource_id,
        name: editResource.name,
        type: editResource.type,
        provider: editResource.provider,
        region: editResource.region,
        cpu_utilization: editResource.cpu_utilization,
        memory_utilization: editResource.memory_utilization,
        storage_utilization: editResource.storage_utilization,
        network_utilization: editResource.network_utilization,
        hourly_cost: editResource.hourly_cost,
      });
    } else {
      setFormData({
        resource_id: `vm-${Math.floor(100 + Math.random() * 900)}`,
        name: 'New-Service-Instance',
        type: 'VM',
        provider: 'AWS',
        region: 'us-east-1',
        cpu_utilization: 12,
        memory_utilization: 14,
        storage_utilization: 10,
        network_utilization: 8,
        hourly_cost: 0.18,
      });
    }
    setError(null);
  }, [editResource, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit(formData, !!editResource);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const avgUtil = (
    (Number(formData.cpu_utilization) +
      Number(formData.memory_utilization) +
      Number(formData.storage_utilization) +
      Number(formData.network_utilization)) /
    4
  ).toFixed(1);

  const monthlyCost = (Number(formData.hourly_cost) * 730).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">
            {editResource ? `Edit Resource ${editResource.resource_id}` : 'Register New Cloud Resource'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Resource Identifier
              </label>
              <input
                type="text"
                required
                disabled={!!editResource}
                value={formData.resource_id}
                onChange={(e) => setFormData({ ...formData, resource_id: e.target.value })}
                placeholder="e.g. vm-101"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded text-white font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Resource Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Prod-Search-Index"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Provider</label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="AWS">AWS</option>
                <option value="Azure">Azure</option>
                <option value="GCP">GCP</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="VM">Virtual Machine (VM)</option>
                <option value="Database">Database (RDS/SQL)</option>
                <option value="Storage">Cloud Storage</option>
                <option value="Cache">Redis/Memcached</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Region</label>
              <input
                type="text"
                required
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="us-east-1"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Utilization Metrics Sliders */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200">Utilization Metrics (%)</span>
              <span className="font-mono text-cyan-400">Computed Average: {avgUtil}%</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
                  <span>CPU Usage</span>
                  <span>{formData.cpu_utilization}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.cpu_utilization}
                  onChange={(e) => setFormData({ ...formData, cpu_utilization: Number(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
                  <span>Memory Usage</span>
                  <span>{formData.memory_utilization}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.memory_utilization}
                  onChange={(e) => setFormData({ ...formData, memory_utilization: Number(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
                  <span>Storage Usage</span>
                  <span>{formData.storage_utilization}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.storage_utilization}
                  onChange={(e) => setFormData({ ...formData, storage_utilization: Number(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
                  <span>Network Usage</span>
                  <span>{formData.network_utilization}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.network_utilization}
                  onChange={(e) => setFormData({ ...formData, network_utilization: Number(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Hourly Cost & Estimated Monthly Cost */}
          <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Hourly Cost ($/hr)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.hourly_cost}
                  onChange={(e) => setFormData({ ...formData, hourly_cost: Number(e.target.value) })}
                  className="w-full pl-7 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-xs">
              <span className="text-slate-400 block">Est. Monthly Cost</span>
              <span className="font-mono font-semibold text-white text-sm tabular-nums">
                ${monthlyCost}
              </span>
              <span className="text-[10px] text-slate-500 block">@ 730 hrs/month</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded transition-colors cursor-pointer"
            >
              {loading ? 'Saving...' : editResource ? 'Update Resource' : 'Create Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
