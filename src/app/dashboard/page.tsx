'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Trees, AlertCircle } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';

interface AppStatus {
  id: string;
  device_id: string;
  name: string;
  version: string;
  latest_version: string | null;
  patch_status: 'outdated' | 'current' | 'unknown' | 'na';
  label?: string;
}

interface Device {
  id: string;
  hostname: string;
}

interface Stats {
  totalDevices: number;
  totalApps: number;
  outdatedApps: number;
  totalInstalls: number;
  lastCheckin: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [allAppsStatus, setAllAppsStatus] = useState<AppStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrchardModal, setShowOrchardModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'silent' | 'managed' | 'prompted'>('managed');
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [orchardLoading, setOrchardLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch stats
        const statsRes = await fetch('/api/stats');
        const statsData = await statsRes.json();
        setStats(statsData);

        // Fetch devices list
        const devicesRes = await fetch('/api/devices');
        const devicesData = await devicesRes.json();
        const deviceList = devicesData.devices || [];
        setDevices(deviceList);

        // Fetch app status for each device and aggregate
        const allApps: AppStatus[] = [];
        for (const device of deviceList) {
          const statusRes = await fetch(`/api/apps/status?device_id=${device.id}`);
          const statusData = await statusRes.json();
          allApps.push(...(statusData.apps || []));
        }
        setAllAppsStatus(allApps);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Calculate status counts
  const statusCounts = {
    outdated: allAppsStatus.filter(a => a.patch_status === 'outdated').length,
    current: allAppsStatus.filter(a => a.patch_status === 'current').length,
    unknown: allAppsStatus.filter(a => a.patch_status === 'unknown').length,
    system: allAppsStatus.filter(a => a.patch_status === 'na').length,
  };

  // Derive top outdated apps
  const outdatedByLabel = new Map<string, { label: string; name: string; devices: Set<string> }>();
  allAppsStatus
    .filter(a => a.patch_status === 'outdated')
    .forEach(app => {
      const key = app.label || 'unknown';
      if (!outdatedByLabel.has(key)) {
        outdatedByLabel.set(key, { label: key, name: app.name, devices: new Set() });
      }
      outdatedByLabel.get(key)!.devices.add(app.device_id);
    });

  const topOutdated = Array.from(outdatedByLabel.values())
    .map(item => ({
      label: item.label,
      name: item.name,
      deviceCount: item.devices.size,
    }))
    .sort((a, b) => b.deviceCount - a.deviceCount)
    .slice(0, 6);

  // Donut chart data
  const chartData = [
    { name: 'Outdated', value: statusCounts.outdated, fill: '#ef4444' },
    { name: 'Current', value: statusCounts.current, fill: '#22c55e' },
    { name: 'Unknown', value: statusCounts.unknown, fill: '#f59e0b' },
    { name: 'System', value: statusCounts.system, fill: '#9ca3af' },
  ].filter(d => d.value > 0);

  const handleOrchardConfirm = async () => {
    if (!confirmCheckbox) return;

    setOrchardLoading(true);
    try {
      const res = await fetch('/api/patch-jobs/orchard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: selectedMode }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(`Error: ${data.error || 'Failed to queue jobs'}`);
        return;
      }

      // Success — redirect to patch history
      setShowOrchardModal(false);
      router.push(`/patches?method=orchard`);
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setOrchardLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 p-6">
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  const totalOutdated = topOutdated.reduce((sum, a) => sum + a.deviceCount, 0);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-3xl font-bold text-foreground">Fleet Dashboard</h1>
          <p className="text-foreground/70 mt-1">Monitor your device fleet and manage patches</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Stat Pills */}
          <div className="flex gap-4 items-center flex-wrap">
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-gray-600 uppercase tracking-wide">Outdated</p>
              <p className="text-2xl font-bold text-red-600">{statusCounts.outdated}</p>
            </div>
            <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-gray-600 uppercase tracking-wide">Current</p>
              <p className="text-2xl font-bold text-green-600">{statusCounts.current}</p>
            </div>
            <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-gray-600 uppercase tracking-wide">Unknown</p>
              <p className="text-2xl font-bold text-amber-600">{statusCounts.unknown}</p>
            </div>
            <div className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg">
              <p className="text-xs text-gray-600 uppercase tracking-wide">System</p>
              <p className="text-2xl font-bold text-gray-700">{statusCounts.system}</p>
            </div>
            <div className="ml-auto text-sm text-gray-600">
              Synced {stats?.lastCheckin ? 'today' : 'never'}
            </div>
          </div>

          {/* Two-column grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Donut Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Fleet Health</h2>
              <div className="relative h-64 flex items-center justify-center">
                {chartData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          animationBegin={0}
                          animationDuration={800}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center label overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-red-600">{statusCounts.outdated}</p>
                        <p className="text-xs text-gray-600 mt-1">outdated</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-400">No data</p>
                )}
              </div>
              {/* Legend */}
              <div className="mt-6 space-y-2 text-sm">
                {chartData.map(item => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-gray-700">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Top Outdated */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Top Outdated Apps</h2>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {topOutdated.length > 0 ? (
                  topOutdated.map(app => (
                    <div key={app.label} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orchardpatch-green to-emerald-600 flex items-center justify-center text-white text-xs font-semibold mb-2">
                          {app.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-gray-900">{app.name}</p>
                      </div>
                      <div className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded">
                        {app.deviceCount} device{app.deviceCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">No outdated apps</p>
                )}
              </div>
              <Link href="/apps" className="mt-4 text-sm text-orchardpatch-green hover:underline inline-block">
                View all in App Inventory →
              </Link>
            </div>
          </div>

          {/* Patch by the Orchard Card */}
          <div className="bg-white rounded-lg border-2 border-amber-400 shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Trees className="w-6 h-6 text-amber-600" />
                <div>
                  <h3 className="text-lg font-semibold">Patch by the Orchard</h3>
                  <p className="text-sm text-gray-600">Queue patches across your entire fleet</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                This will queue patch jobs across every device in your fleet. Review before confirming.
              </p>
            </div>

            <button
              onClick={() => {
                setConfirmCheckbox(false);
                setSelectedMode('managed');
                setShowOrchardModal(true);
              }}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium"
            >
              Patch All Outdated ({statusCounts.outdated} apps · {devices.length} devices)
            </button>
          </div>

          {/* Pinned Apps Section (Empty State) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Pinned Apps</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-100 rounded border border-dashed border-gray-300 flex items-center justify-center opacity-40">
                  <div className="text-center">
                    <Trees className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-700">Pin app</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-700">
              Pin your most critical apps for quick access and monitoring. Coming soon.
            </p>
          </div>
        </div>
      </main>

      {/* Orchard Modal */}
      {showOrchardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b flex items-center gap-3">
              <Trees className="w-6 h-6 text-amber-600" />
              <div>
                <h2 className="text-xl font-semibold">Patch by the Orchard</h2>
                <p className="text-sm text-gray-600">Review everything that will be patched</p>
              </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {topOutdated.length > 0 ? (
                topOutdated.map(app => (
                  <div key={app.label} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{app.name}</p>
                      <p className="text-xs text-gray-600">{app.label}</p>
                    </div>
                    <div className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded">
                      {app.deviceCount} device{app.deviceCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No outdated apps</p>
              )}
            </div>

            {/* Summary */}
            <div className="px-6 py-4 border-t bg-gray-50 text-sm text-gray-700">
              <p>
                <span className="font-semibold">{topOutdated.length} apps</span> across{' '}
                <span className="font-semibold">{devices.length} devices</span> —{' '}
                <span className="font-semibold">{statusCounts.outdated} total patch jobs</span>
              </p>
            </div>

            {/* Mode Selector */}
            <div className="px-6 py-4 border-t space-y-3">
              <p className="text-sm font-medium text-gray-900">Patch Mode</p>
              <div className="grid grid-cols-3 gap-3">
                {(['silent', 'managed', 'prompted'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setSelectedMode(mode)}
                    className={`p-3 rounded-lg border-2 transition ${
                      selectedMode === mode
                        ? 'border-orchardpatch-green bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900 capitalize">{mode}</p>
                    {mode === 'managed' && <p className="text-xs text-gray-600 mt-1">(recommended)</p>}
                  </button>
                ))}
              </div>
            </div>

            {/* Warning Banner */}
            <div className="px-6 py-4 border-t bg-amber-50 border-t-amber-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">This will affect your entire fleet</p>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <div className="px-6 py-4 border-t">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmCheckbox}
                  onChange={e => setConfirmCheckbox(e.target.checked)}
                  className="w-4 h-4 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-900">
                  I understand this will affect my entire fleet
                </span>
              </label>
            </div>

            {/* Buttons */}
            <div className="px-6 py-4 border-t bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={() => setShowOrchardModal(false)}
                disabled={orchardLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleOrchardConfirm}
                disabled={!confirmCheckbox || orchardLoading}
                className="px-4 py-2 bg-orchardpatch-green text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {orchardLoading ? 'Starting...' : 'Start Patching'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
