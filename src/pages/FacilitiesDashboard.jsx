import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wrench,
  Bell,
  Settings,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Search,
  Building2,
  ChevronDown,
  CheckCircle,
  Activity
} from 'lucide-react';
import { mockRooms } from '../mockData/rooms';
import { fetchRooms, fetchAlerts } from '../services/api';
import NLQueryPanel from '../components/NLQueryPanel';

export default function FacilitiesDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Maintenance Queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [queueFilter, setQueueFilter] = useState('All');
  const [resolvedIds, setResolvedIds] = useState([]);
  const [toastMessage, setToastMessage] = useState('');

  // Real API state with mock defaults
  const [rooms, setRooms] = useState(mockRooms);
  const [alerts, setAlerts] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const roomsData = await fetchRooms();
        if (isMounted && roomsData) setRooms(roomsData);
      } catch (err) {
        console.error('Error loading rooms for Facilities:', err);
      }

      try {
        const alertsData = await fetchAlerts();
        if (isMounted && alertsData) setAlerts(alertsData);
      } catch (err) {
        console.error('Error loading alerts for Facilities:', err);
      }
    };

    loadData();

    // 5-second polling for live room updates
    const interval = setInterval(async () => {
      try {
        const updatedRooms = await fetchRooms();
        if (isMounted && updatedRooms) setRooms(updatedRooms);
      } catch (err) {
        console.error('Error polling rooms for Facilities:', err);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Handle role dropdown navigation
  const handleRoleChange = (e) => {
    const selectedRole = e.target.value;
    if (selectedRole === 'Admin') {
      navigate('/admin');
    } else if (selectedRole === 'Faculty') {
      navigate('/faculty');
    } else if (selectedRole === 'Facilities') {
      navigate('/facilities');
    }
  };

  // Reasons map for anomalies
  const anomalyReasons = {
    R204: 'High power usage (1,450 W) with zero occupancy for 25+ mins',
    R305: 'Critical telemetry flag (1,800 W spike), recurring daily energy leaks',
  };

  // Anomalies queue (rooms that are wasting or flagged)
  const anomalies = alerts || rooms.filter(
    (room) => room.status === 'wasting' || room.status === 'flagged'
  );

  // Filtered queue based on tab selection and resolution state
  const filteredQueue = anomalies.filter((room) => {
    const matchesFilter =
      queueFilter === 'All' ||
      (queueFilter === 'Flagged' && room.status === 'flagged') ||
      (queueFilter === 'Wasting' && room.status === 'wasting');
    const matchesSearch =
      (room.name || room.room_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.building || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.room_id || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'normal':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'Normal',
        };
      case 'wasting':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500 animate-pulse',
          label: 'Wasting',
        };
      case 'flagged':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500 animate-ping',
          label: 'Flagged',
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          label: status,
        };
    }
  };

  const handleMarkResolved = (roomId) => {
    if (!resolvedIds.includes(roomId)) {
      setResolvedIds([...resolvedIds, roomId]);
      setToastMessage(`Maintenance ticket for ${roomId} marked as Resolved.`);
      setTimeout(() => setToastMessage(''), 3500);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Sidebar with Gradient Background */}
      <aside className="w-64 bg-gradient-to-b from-[#0f172a] via-[#131d38] to-[#1a2547] text-slate-300 flex flex-col justify-between flex-shrink-0 shadow-2xl relative z-20 overflow-hidden">
        {/* Top Slim Gradient Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"></div>

        <div className="p-4 pt-6 space-y-6">
          {/* Sidebar Nav (Maintenance Queue, Alerts, Settings) */}
          <nav className="space-y-1.5">
            {[
              { name: 'Maintenance Queue', icon: Wrench, badge: `${anomalies.length - resolvedIds.length}` },
              { name: 'Alerts', icon: Bell, badge: '2' },
              { name: 'Settings', icon: Settings, badge: null },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/25 to-violet-600/25 text-indigo-300 font-semibold border border-indigo-500/30 shadow-md shadow-indigo-500/10 backdrop-blur-xs'
                      : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-indigo-400' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4">
          <div className="bg-slate-900/80 backdrop-blur-md rounded-xl p-3.5 border border-slate-800/80 shadow-inner">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Facilities Dispatch
              </span>
              <span className="text-[11px] text-emerald-400 font-mono font-bold">5s Polling</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              HVAC & Electrical Maintenance Team
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 relative">
        {/* Header Bar */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 py-3.5 flex items-center justify-between shadow-xs">
          <div>
            {/* Small ClassWatch Branding */}
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-4 h-4 rounded bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-xs">
                <Zap className="w-2.5 h-2.5" />
              </div>
              <span className="text-[11px] font-extrabold tracking-wider uppercase bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                ClassWatch
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">• Maintenance Portal</span>
            </div>

            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                ClassWatch — Facilities
              </h2>

              {/* Role Dropdown Selector */}
              <div className="relative inline-flex items-center">
                <select
                  value="Facilities"
                  onChange={handleRoleChange}
                  className="appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-xs"
                >
                  <option value="Admin">Admin Role</option>
                  <option value="Faculty">Faculty Role</option>
                  <option value="Facilities">Facilities Role</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-600 absolute right-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search maintenance queue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 text-sm bg-slate-100/80 hover:bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Profile & Notifications */}
            <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3 pl-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-emerald-500/20">
                FC
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-xs font-bold text-slate-800">Facilities Team</p>
                <p className="text-[10px] text-slate-500">HVAC / Electrical</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-8 space-y-6 max-w-7xl mx-auto w-full relative">
          {/* Toast Notification */}
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between font-medium text-sm border border-emerald-500"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>{toastMessage}</span>
              </div>
              <span className="text-xs font-bold bg-emerald-700 px-2 py-0.5 rounded">Success</span>
            </motion.div>
          )}

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-600" />
                Anomaly & Maintenance Queue
              </h3>
              <p className="text-xs text-slate-500">
                Actionable list of rooms requiring HVAC/Electrical inspection or manual override (5s sync)
              </p>
            </div>

            {/* Queue Filter Tabs: All, Flagged, Wasting */}
            <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl">
              {['All', 'Flagged', 'Wasting'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setQueueFilter(tab)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    queueFilter === tab
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Maintenance Queue List Items Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
            {filteredQueue.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-bold text-slate-700">No pending anomalies in queue</p>
                <p className="text-xs">All monitored room sensors are operating within normal parameters.</p>
              </div>
            ) : (
              filteredQueue.map((room, index) => {
                const badge = getStatusBadge(room.status);
                const isResolved = resolvedIds.includes(room.room_id);
                return (
                  <motion.div
                    key={room.room_id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                    className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                      isResolved ? 'bg-slate-50/60 opacity-60' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Left Details */}
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                          room.status === 'flagged'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {room.room_id || 'R'}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-slate-900 text-base">
                            {room.name || `Room ${room.room_id}`}
                          </h4>
                          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {room.building || 'Campus Block'}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg}`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${badge.dot}`}
                            ></span>
                            {badge.label}
                          </span>
                        </div>

                        {/* Reason String */}
                        <p className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span>{room.reason || anomalyReasons[room.room_id] || 'Unexpected power telemetry anomaly detected'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Right Telemetry & Resolution Action */}
                    <div className="flex items-center gap-6 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 justify-between md:justify-end">
                      <div className="text-right">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Live Consumption
                        </span>
                        <span className="text-base font-extrabold text-slate-900 font-mono">
                          {(room.power_watts || 1200).toLocaleString()} W
                        </span>
                      </div>

                      {/* Mark Resolved Button */}
                      <button
                        onClick={() => handleMarkResolved(room.room_id)}
                        disabled={isResolved}
                        className={`px-4 py-2 border rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                          isResolved
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 cursor-not-allowed opacity-80'
                            : 'border-emerald-500 text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100/90 shadow-xs active:scale-95'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>{isResolved ? 'Resolved' : 'Mark Resolved'}</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* AI Energy Intelligence NL Query Panel */}
          <NLQueryPanel />
        </div>
      </main>
    </div>
  );
}
