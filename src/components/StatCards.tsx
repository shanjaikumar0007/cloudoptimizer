import React from 'react';
import { DashboardStats } from '../types';
import { Server, AlertTriangle, DollarSign, TrendingDown } from 'lucide-react';

interface StatCardsProps {
  stats: DashboardStats;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
  const savingsPct =
    stats.estimated_monthly_cost > 0
      ? ((stats.potential_savings / stats.estimated_monthly_cost) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Resources */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Total Monitored Fleet</span>
          <Server className="w-4 h-4 text-slate-500" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
            {stats.total_resources}
          </span>
          <span className="text-xs text-slate-400">instances</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <span>Active {stats.active_resources}</span>
          <span aria-hidden="true">·</span>
          <span>High Load {stats.high_utilization_resources}</span>
        </div>
      </div>

      {/* Idle Resources */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Critical Idle Resources</span>
          <AlertTriangle className="w-4 h-4 text-rose-400" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono tracking-tight text-rose-400 tabular-nums">
            {stats.idle_resources}
          </span>
          <span className="text-xs text-slate-400">below 15% avg</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <span>Action: STOP_RESOURCE</span>
          <span aria-hidden="true">·</span>
          <span>100% cost reduction</span>
        </div>
      </div>

      {/* Monthly Fleet Cost */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Est. Monthly Fleet Cost</span>
          <DollarSign className="w-4 h-4 text-slate-500" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
            ${stats.estimated_monthly_cost.toFixed(2)}
          </span>
          <span className="text-xs text-slate-400">/mo</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <span>Based on 730 hrs/month</span>
          <span aria-hidden="true">·</span>
          <span>On-demand rate</span>
        </div>
      </div>

      {/* Potential Monthly Savings */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Calculated Potential Savings</span>
          <TrendingDown className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono tracking-tight text-emerald-400 tabular-nums">
            ${stats.potential_savings.toFixed(2)}
          </span>
          <span className="text-xs text-slate-400 font-mono tabular-nums">({savingsPct}%)</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <span>{stats.underutilized_resources} downsize candidate(s)</span>
          <span aria-hidden="true">·</span>
          <span>{stats.idle_resources} stop candidate(s)</span>
        </div>
      </div>
    </div>
  );
};
