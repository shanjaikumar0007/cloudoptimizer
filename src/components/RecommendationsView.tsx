import React from 'react';
import { Resource } from '../types';
import { TrendingDown, Power, Minimize2, CheckCircle2 } from 'lucide-react';

interface RecommendationsViewProps {
  resources: Resource[];
  onApplyAction: (resource: Resource, targetAction: 'stop' | 'resize') => void;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  resources,
  onApplyAction,
}) => {
  const idleResources = resources.filter((r) => r.recommendation?.action === 'STOP_RESOURCE');
  const resizeResources = resources.filter((r) => r.recommendation?.action === 'CONSIDER_RESIZE');
  const healthyResources = resources.filter((r) => r.recommendation?.action === 'KEEP_RESOURCE');

  const idleSavings = idleResources.reduce((acc, r) => acc + (r.recommendation?.savings || 0), 0);
  const resizeSavings = resizeResources.reduce((acc, r) => acc + (r.recommendation?.savings || 0), 0);
  const totalSavings = idleSavings + resizeSavings;

  return (
    <div className="space-y-6">
      {/* Top Banner Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              FinOps Recommendations Engine
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Optimization Plan: Save ${totalSavings.toFixed(2)} / month
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Automated heuristics evaluate CPU, Memory, Disk, and Network telemetry to flag zombie instances and overprovisioned tiers.
            </p>
          </div>

          <div className="flex items-center gap-6 shrink-0 bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div>
              <div className="text-xs text-slate-400">Stop Idle (100% Save)</div>
              <div className="text-lg font-bold font-mono text-rose-400 tabular-nums">
                ${idleSavings.toFixed(2)}/mo
              </div>
              <div className="text-[11px] text-slate-400">{idleResources.length} instance(s)</div>
            </div>
            <div className="w-px h-10 bg-slate-800" />
            <div>
              <div className="text-xs text-slate-400">Downsize (40% Save)</div>
              <div className="text-lg font-bold font-mono text-amber-400 tabular-nums">
                ${resizeSavings.toFixed(2)}/mo
              </div>
              <div className="text-[11px] text-slate-400">{resizeResources.length} instance(s)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stop Resource Candidates */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Power className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-semibold text-white">
              Candidate Instances for Termination (STOP_RESOURCE)
            </h3>
            <span className="text-xs text-slate-400">({idleResources.length} flagged)</span>
          </div>
        </div>

        {idleResources.length === 0 ? (
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>No idle workloads detected. All cloud resources are actively serving traffic.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {idleResources.map((res) => {
              const avg = (
                (res.cpu_utilization +
                  res.memory_utilization +
                  res.storage_utilization +
                  res.network_utilization) /
                4
              ).toFixed(1);

              return (
                <div
                  key={res.resource_id}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-sm font-semibold text-white font-mono">
                          {res.resource_id}
                        </span>
                        <span className="text-xs text-slate-400 ml-2">({res.name})</span>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {res.provider} · {res.region} · {res.type}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-rose-400 block tabular-nums">
                          +${(res.recommendation?.savings || 0).toFixed(2)} / mo
                        </span>
                        <span className="text-[11px] text-slate-400">100% of expense</span>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded border border-slate-800">
                      {res.recommendation?.reason}
                    </p>

                    <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs font-mono">
                      <div className="p-1.5 bg-slate-950 rounded">
                        <span className="text-[10px] text-slate-400 block">CPU</span>
                        <span className="text-white">{res.cpu_utilization}%</span>
                      </div>
                      <div className="p-1.5 bg-slate-950 rounded">
                        <span className="text-[10px] text-slate-400 block">RAM</span>
                        <span className="text-white">{res.memory_utilization}%</span>
                      </div>
                      <div className="p-1.5 bg-slate-950 rounded">
                        <span className="text-[10px] text-slate-400 block">Disk</span>
                        <span className="text-white">{res.storage_utilization}%</span>
                      </div>
                      <div className="p-1.5 bg-slate-950 rounded">
                        <span className="text-[10px] text-slate-400 block">Net</span>
                        <span className="text-white">{res.network_utilization}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Avg: {avg}% (&lt;15% threshold)</span>
                    <button
                      onClick={() => onApplyAction(res, 'stop')}
                      className="px-3 py-1.5 text-xs font-medium text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 rounded transition-colors cursor-pointer"
                    >
                      Decommission / Stop Instance
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resize Candidates */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Minimize2 className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">
              Candidate Instances for Downsizing (CONSIDER_RESIZE)
            </h3>
            <span className="text-xs text-slate-400">({resizeResources.length} flagged)</span>
          </div>
        </div>

        {resizeResources.length === 0 ? (
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>No underutilized instances found. Workloads are sized appropriately.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resizeResources.map((res) => {
              const avg = (
                (res.cpu_utilization +
                  res.memory_utilization +
                  res.storage_utilization +
                  res.network_utilization) /
                4
              ).toFixed(1);

              return (
                <div
                  key={res.resource_id}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-sm font-semibold text-white font-mono">
                          {res.resource_id}
                        </span>
                        <span className="text-xs text-slate-400 ml-2">({res.name})</span>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {res.provider} · {res.region} · {res.type}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-amber-400 block tabular-nums">
                          +${(res.recommendation?.savings || 0).toFixed(2)} / mo
                        </span>
                        <span className="text-[11px] text-slate-400">~40% downsizing delta</span>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded border border-slate-800">
                      {res.recommendation?.reason}
                    </p>

                    <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs font-mono">
                      <div className="p-1.5 bg-slate-950 rounded">
                        <span className="text-[10px] text-slate-400 block">CPU</span>
                        <span className="text-white">{res.cpu_utilization}%</span>
                      </div>
                      <div className="p-1.5 bg-slate-950 rounded">
                        <span className="text-[10px] text-slate-400 block">RAM</span>
                        <span className="text-white">{res.memory_utilization}%</span>
                      </div>
                      <div className="p-1.5 bg-slate-950 rounded">
                        <span className="text-[10px] text-slate-400 block">Disk</span>
                        <span className="text-white">{res.storage_utilization}%</span>
                      </div>
                      <div className="p-1.5 bg-slate-950 rounded">
                        <span className="text-[10px] text-slate-400 block">Net</span>
                        <span className="text-white">{res.network_utilization}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Avg: {avg}% (15%–40% range)</span>
                    <button
                      onClick={() => onApplyAction(res, 'resize')}
                      className="px-3 py-1.5 text-xs font-medium text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/80 rounded transition-colors cursor-pointer"
                    >
                      Downsize Instance Tier
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FinOps Calculation Transparency Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h4 className="text-sm font-semibold text-white">Mathematical Modeling & Estimation Assumptions</h4>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-3 bg-slate-950 rounded border border-slate-800">
            <span className="font-semibold text-white block mb-1">Billing Standard (730 Hours)</span>
            <p className="text-slate-400 leading-relaxed">
              Standard cloud month calculated as 365 days × 24 hours ÷ 12 months = 730 hours. Monthly cost = Hourly Rate × 730.
            </p>
          </div>
          <div className="p-3 bg-slate-950 rounded border border-slate-800">
            <span className="font-semibold text-white block mb-1">Resize Coefficient (40%)</span>
            <p className="text-slate-400 leading-relaxed">
              Downsizing from 2xlarge to xlarge or standard tier reductions consistently produce a ~40% price drop across major providers.
            </p>
          </div>
          <div className="p-3 bg-slate-950 rounded border border-slate-800">
            <span className="font-semibold text-white block mb-1">Safe Threshold Bounds</span>
            <p className="text-slate-400 leading-relaxed">
              Resources between 40% and 80% usage are classified as healthy. High utilization (&ge;80%) flags scaling needs rather than shutdown.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
