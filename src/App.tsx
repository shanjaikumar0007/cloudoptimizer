import React, { useState, useEffect } from 'react';
import { Resource, DashboardStats, ResourceFormData } from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { StatCards } from './components/StatCards';
import { ResourceTable } from './components/ResourceTable';
import { AddResourceModal } from './components/AddResourceModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { RecommendationsView } from './components/RecommendationsView';
import { SimulatorAndTestsView } from './components/SimulatorAndTestsView';
import { ArchitectureAndVivaView } from './components/ArchitectureAndVivaView';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'fleet' | 'recommendations' | 'simulator' | 'architecture'>('fleet');
  const [resources, setResources] = useState<Resource[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_resources: 0,
    idle_resources: 0,
    underutilized_resources: 0,
    active_resources: 0,
    high_utilization_resources: 0,
    estimated_monthly_cost: 0,
    potential_savings: 0,
  });
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editResource, setEditResource] = useState<Resource | null>(null);
  const [deleteResourceTarget, setDeleteResourceTarget] = useState<Resource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const loadData = async () => {
    try {
      const [fleetData, statsData] = await Promise.all([
        api.getResources(),
        api.getDashboardStats(),
      ]);
      setResources(fleetData);
      setStats(statsData);
    } catch (e: any) {
      console.error('Failed to load fleet data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddOrEdit = async (formData: ResourceFormData, isEdit: boolean) => {
    if (isEdit && editResource) {
      await api.updateResource(editResource.resource_id, formData);
      showToast(`Resource ${editResource.resource_id} updated successfully.`);
    } else {
      await api.createResource(formData);
      showToast(`Resource ${formData.resource_id} registered successfully.`);
    }
    await loadData();
    setEditResource(null);
  };

  const handleDeleteConfirm = async (resourceId: string) => {
    setIsDeleting(true);
    try {
      await api.deleteResource(resourceId);
      showToast(`Resource ${resourceId} decommissioned from fleet.`);
      setDeleteResourceTarget(null);
      await loadData();
    } catch (e: any) {
      showToast(`Failed to delete: ${e.message}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSimulate = async (
    resource: Resource,
    targetState: 'spike' | 'idle' | 'nominal' | 'underutilized'
  ) => {
    try {
      const updated = await api.simulateWorkload(resource.resource_id, targetState);
      showToast(
        targetState === 'spike'
          ? `Workload spiked to 92% on ${resource.resource_id}. Recommendation updated to KEEP_RESOURCE.`
          : `Workload cooled down on ${resource.resource_id}.`
      );
      await loadData();
    } catch (e: any) {
      showToast(`Simulation failed: ${e.message}`, 'error');
    }
  };

  const handleReseed = async () => {
    try {
      await api.reseedFleet();
      showToast('Fleet reseeded to standard benchmark workloads.');
      await loadData();
    } catch (e: any) {
      showToast('Failed to reset demo fleet', 'error');
    }
  };

  const handleApplyRecommendation = async (resource: Resource, targetAction: 'stop' | 'resize') => {
    if (targetAction === 'stop') {
      setDeleteResourceTarget(resource);
    } else {
      // Resize: reduce hourly cost by 40% and adjust utilization to nominal 50%
      const newHourlyCost = Number((resource.hourly_cost * 0.6).toFixed(2));
      await api.updateResource(resource.resource_id, {
        hourly_cost: newHourlyCost,
        cpu_utilization: 52,
        memory_utilization: 56,
        storage_utilization: 45,
        network_utilization: 48,
      });
      showToast(`Instance ${resource.resource_id} downsized. Monthly expense reduced by 40%.`);
      await loadData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar Contract (3 zones) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          setEditResource(null);
          setIsAddModalOpen(true);
        }}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-lg shadow-xl border flex items-center gap-3 transition-all ${
              toast.type === 'success'
                ? 'bg-slate-900 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900 border-rose-500/50 text-rose-300'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            )}
            <span className="text-xs font-medium">{toast.message}</span>
          </div>
        )}

        {/* View Routing */}
        {activeTab === 'fleet' && (
          <div className="space-y-6">
            {/* KPI Stat Cards */}
            <StatCards stats={stats} />

            {/* High-Density Resource Fleet Table */}
            <ResourceTable
              resources={resources}
              onDeleteClick={(r) => setDeleteResourceTarget(r)}
              onEditClick={(r) => {
                setEditResource(r);
                setIsAddModalOpen(true);
              }}
              onSimulateClick={handleSimulate}
              onReseedClick={handleReseed}
            />
          </div>
        )}

        {activeTab === 'recommendations' && (
          <RecommendationsView
            resources={resources}
            onApplyAction={handleApplyRecommendation}
          />
        )}

        {activeTab === 'simulator' && (
          <SimulatorAndTestsView
            resources={resources}
            onRefreshData={loadData}
          />
        )}

        {activeTab === 'architecture' && <ArchitectureAndVivaView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>CloudOptimizer Platform</span>
            <span aria-hidden="true">·</span>
            <span>Decoupled Architecture: FastAPI & SQLite Engine</span>
          </div>
          <div>All heuristic thresholds compliant with FinOps standards</div>
        </div>
      </footer>

      {/* Add / Edit Resource Modal */}
      <AddResourceModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditResource(null);
        }}
        onSubmit={handleAddOrEdit}
        editResource={editResource}
      />

      {/* Delete Confirmation Modal (Stage 7 Next Steps requirement) */}
      <DeleteConfirmModal
        isOpen={!!deleteResourceTarget}
        resource={deleteResourceTarget}
        onClose={() => setDeleteResourceTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />
    </div>
  );
}
