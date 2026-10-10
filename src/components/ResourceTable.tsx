import React, { useState } from 'react';
import { Resource } from '../types';
import { Search, Trash2, Edit2, Zap, RotateCcw, ArrowUpDown } from 'lucide-react';

interface ResourceTableProps {
  resources: Resource[];
  onDeleteClick: (resource: Resource) => void;
  onEditClick: (resource: Resource) => void;
  onSimulateClick: (resource: Resource, state: 'spike' | 'idle' | 'nominal' | 'underutilized') => void;
  onReseedClick: () => void;
}

export const ResourceTable: React.FC<ResourceTableProps> = ({
  resources,
  onDeleteClick,
  onEditClick,
  onSimulateClick,
  onReseedClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'id' | 'cost' | 'savings' | 'avgUtil'>('id');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const filtered = resources
    .filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.resource_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.region.toLowerCase().includes(searchTerm.toLowerCase());
      const matchProvider = selectedProvider === 'All' || r.provider === selectedProvider;
      const status = r.recommendation?.status || 'Active';
      const matchStatus = selectedStatus === 'All' || status === selectedStatus;
      return matchSearch && matchProvider && matchStatus;
    })
    .sort((a, b) => {
      let diff = 0;
      if (sortBy === 'id') diff = a.resource_id.localeCompare(b.resource_id);
      else if (sortBy === 'cost') diff = a.hourly_cost - b.hourly_cost;
      else if (sortBy === 'savings') diff = (a.recommendation?.savings || 0) - (b.recommendation?.savings || 0);
      else if (sortBy === 'avgUtil') {
        const avgA = (a.cpu_utilization + a.memory_utilization + a.storage_utilization + a.network_utilization) / 4;
        const avgB = (b.cpu_utilization + b.memory_utilization + b.storage_utilization + b.network_utilization) / 4;
        diff = avgA - avgB;
      }
      return sortAsc ? diff : -diff;
    });

  const toggleSort = (col: 'id' | 'cost' | 'savings' | 'avgUtil') => {
    if (sortBy === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(col);
      setSortAsc(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Idle':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-950/60 text-rose-300 border border-rose-800/60">
            Idle (&lt;15%)
          </span>
        );
      case 'Underutilized':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-800/60">
            Underutilized (&lt;40%)
          </span>
        );
      case 'High Utilization':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
            High Load (&ge;80%)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
            Active (Optimal)
          </span>
        );
    }
  };

  const getActionBadge = (action?: string, savings?: number) => {
    if (action === 'STOP_RESOURCE') {
      return (
        <div className="text-right">
          <span className="text-xs font-medium text-rose-400 block whitespace-nowrap">STOP_RESOURCE</span>
          <span className="text-xs font-mono text-emerald-400 tabular-nums whitespace-nowrap">
            Save ${savings?.toFixed(2)}/mo
          </span>
        </div>
      );
    }
    if (action === 'CONSIDER_RESIZE') {
      return (
        <div className="text-right">
          <span className="text-xs font-medium text-amber-400 block whitespace-nowrap">CONSIDER_RESIZE</span>
          <span className="text-xs font-mono text-emerald-400 tabular-nums whitespace-nowrap">
            Save ${savings?.toFixed(2)}/mo
          </span>
        </div>
      );
    }
    return (
      <div className="text-right">
        <span className="text-xs font-medium text-slate-400 block whitespace-nowrap">KEEP_RESOURCE</span>
        <span className="text-xs text-slate-400 whitespace-nowrap">Standard retention</span>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[220px] max-w-xs flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search resource ID, name, region..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-md text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Provider Filter */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-950 border border-slate-800 rounded-md">
            {['All', 'AWS', 'Azure', 'GCP'].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedProvider(p)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  selectedProvider === p
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-950 border border-slate-800 rounded-md">
            {['All', 'Idle', 'Underutilized', 'Active', 'High Utilization'].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  selectedStatus === s
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s === 'High Utilization' ? 'High Load' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Reseed / Reset Fleet */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onReseedClick}
            title="Reset fleet back to standard benchmark workload state"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Fleet</span>
          </button>
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium">
              <th className="py-3 px-4">
                <button
                  onClick={() => toggleSort('id')}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                >
                  <span>Resource</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-3">Provider & Region</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">
                <button
                  onClick={() => toggleSort('avgUtil')}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                >
                  <span>Avg Util</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-3 min-w-[200px]">Metrics (CPU / RAM / Disk / Net)</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">
                <button
                  onClick={() => toggleSort('cost')}
                  className="inline-flex items-center gap-1 hover:text-white transition-colors ml-auto cursor-pointer"
                >
                  <span>Cost</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-3 text-right">
                <button
                  onClick={() => toggleSort('savings')}
                  className="inline-flex items-center gap-1 hover:text-white transition-colors ml-auto cursor-pointer"
                >
                  <span>Recommended Action</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  No cloud resources matching current search and filters.
                </td>
              </tr>
            ) : (
              filtered.map((res) => {
                const avgUtil = Number(
                  (
                    (res.cpu_utilization +
                      res.memory_utilization +
                      res.storage_utilization +
                      res.network_utilization) /
                    4
                  ).toFixed(1)
                );
                const monthlyCost = (res.hourly_cost * 730).toFixed(2);

                return (
                  <tr
                    key={res.resource_id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Resource ID & Name */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-white font-mono">{res.resource_id}</div>
                      <div className="text-slate-400 text-[11px] truncate max-w-[140px]">{res.name}</div>
                    </td>

                    {/* Provider & Region */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="text-slate-200 font-medium">{res.provider}</div>
                      <div className="text-slate-500 text-[11px] font-mono">{res.region}</div>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap">{res.type}</td>

                    {/* Avg Utilization */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-mono tabular-nums font-semibold text-slate-100">
                        {avgUtil}%
                      </span>
                    </td>

                    {/* Metric Breakdown Bars */}
                    <td className="py-3 px-3">
                      <div className="space-y-1 text-[11px] font-mono tabular-nums">
                        <div className="flex items-center justify-between text-slate-400">
                          <span>CPU {res.cpu_utilization}%</span>
                          <span>RAM {res.memory_utilization}%</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 h-1.5 w-full bg-slate-950 rounded overflow-hidden">
                          <div
                            style={{ width: `${res.cpu_utilization}%` }}
                            className={`h-full ${
                              res.cpu_utilization >= 80
                                ? 'bg-rose-500'
                                : res.cpu_utilization < 15
                                ? 'bg-slate-600'
                                : 'bg-cyan-500'
                            }`}
                          />
                          <div
                            style={{ width: `${res.memory_utilization}%` }}
                            className={`h-full ${
                              res.memory_utilization >= 80
                                ? 'bg-rose-500'
                                : res.memory_utilization < 15
                                ? 'bg-slate-600'
                                : 'bg-indigo-500'
                            }`}
                          />
                          <div
                            style={{ width: `${res.storage_utilization}%` }}
                            className="h-full bg-emerald-500"
                          />
                          <div
                            style={{ width: `${res.network_utilization}%` }}
                            className="h-full bg-amber-500"
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getStatusBadge(res.recommendation?.status)}
                    </td>

                    {/* Cost */}
                    <td className="py-3 px-3 text-right whitespace-nowrap font-mono tabular-nums">
                      <div className="text-white font-medium">${monthlyCost}/mo</div>
                      <div className="text-slate-500 text-[11px]">${res.hourly_cost.toFixed(2)}/hr</div>
                    </td>

                    {/* Recommended Action */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getActionBadge(res.recommendation?.action, res.recommendation?.savings)}
                    </td>

                    {/* Interactive Actions (Simulate, Edit, Delete) */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Workload Spike Simulator trigger */}
                        <div className="relative group/sim inline-block">
                          <button
                            onClick={() =>
                              onSimulateClick(
                                res,
                                res.cpu_utilization >= 80 ? 'idle' : 'spike'
                              )
                            }
                            title={
                              res.cpu_utilization >= 80
                                ? 'Simulate Workload Cooldown to Idle'
                                : 'Simulate Sudden Workload Spike (to 92%)'
                            }
                            className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Edit Button */}
                        <button
                          onClick={() => onEditClick(res)}
                          title="Edit resource parameters"
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button (Wired to DELETE /api/resources/{id}) */}
                        <button
                          onClick={() => onDeleteClick(res)}
                          title={`Delete resource ${res.resource_id}`}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Table summary */}
      <div className="p-3 bg-slate-950/40 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <div>
          Showing {filtered.length} of {resources.length} monitored resources
        </div>
        <div className="flex items-center gap-3">
          <span>730 billable hrs/mo standard</span>
          <span aria-hidden="true">·</span>
          <span>FastAPI / SQLite decoupled engine</span>
        </div>
      </div>
    </div>
  );
};
