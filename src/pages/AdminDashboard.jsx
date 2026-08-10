import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Trophy,
  Bell,
  Settings,
  Zap,
  IndianRupee,
  Leaf,
  Users,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Search,
  ChevronRight,
  ChevronDown,
  Shield,
  Building2,
  Activity,
  Sparkles
} from 'lucide-react';
import { mockRooms } from '../mockData/rooms';
import { mockLeaderboard } from '../mockData/leaderboard';
import { fetchRooms, fetchLeaderboard, fetchLedger } from '../services/api';
import NLQueryPanel from '../components/NLQueryPanel';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('All');
  const [role, setRole] = useState('Admin');

  // Real API state with mock defaults
  const [rooms, setRooms] = useState(mockRooms);
  const [leaderboard, setLeaderboard] = useState(mockLeaderboard);
  const [ledger, setLedger] = useState({
    total_kwh_saved: 1248,
    total_inr_saved: 9984,
    total_co2_saved_kg: 1023,
  });

  // Fetch data on mount and set up 5s polling for rooms
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const roomsData = await fetchRooms();
        if (isMounted && roomsData) setRooms(roomsData);
      } catch (err) {
        console.error('Error loading rooms:', err);
      }

      try {
        const lbData = await fetchLeaderboard();
        if (isMounted && lbData) setLeaderboard(lbData);
      } catch (err) {
        console.error('Error loading leaderboard:', err);
      }

      try {
        const ledgerData = await fetchLedger();
        if (isMounted && ledgerData) setLedger(ledgerData);
      } catch (err) {
        console.error('Error loading ledger:', err);
      }
    };

    loadData();

    // 5-second polling for live room updates
    const interval = setInterval(async () => {
      try {
        const updatedRooms = await fetchRooms();
        if (isMounted && updatedRooms) setRooms(updatedRooms);
      } catch (err) {
        console.error('Error polling rooms:', err);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleRoleChange = (e) => {
    const selectedRole = e.target.value;
    if (selectedRole === 'Faculty') {
      navigate('/faculty');
    } else if (selectedRole === 'Admin') {
      navigate('/admin');
    } else if (selectedRole === 'Facilities') {
      navigate('/facilities');
    }
  };

  // Filter rooms based on search and building filter
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.building.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.room_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBuilding =
      filterBuilding === 'All' || room.building === filterBuilding;
    return matchesSearch && matchesBuilding;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'normal':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'Normal',
          icon: CheckCircle2,
        };
      case 'wasting':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500 animate-pulse',
          label: 'Wasting',
          icon: AlertTriangle,
        };
      case 'flagged':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500 animate-ping',
          label: 'Flagged',
          icon: AlertTriangle,
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          label: status,
          icon: Activity,
        };
    }
  };

  const getEfficiencyGradient = (score) => {
    if (score >= 80) return 'bg-gradient-to-r from-emerald-400 to-emerald-600';
    if (score >= 60) return 'bg-gradient-to-r from-amber-400 to-amber-600';
    return 'bg-gradient-to-r from-rose-400 to-rose-600';
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Sidebar with Gradient Background */}
      <aside className="w-64 bg-gradient-to-b from-[#0f172a] via-[#131d38] to-[#1a2547] text-slate-300 flex flex-col justify-between flex-shrink-0 shadow-2xl relative z-20 overflow-hidden">
        {/* Top Slim Gradient Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"></div>

        <div className="p-4 pt-6 space-y-6">
          {/* Navigation Items (Starts directly at top of sidebar) */}
          <nav className="space-y-1.5">
            {[
              { name: 'Dashboard', icon: LayoutDashboard, badge: null },
              { name: 'Leaderboard', icon: Trophy, badge: 'Live' },
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
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.badge === 'Live'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer / System Telemetry Status */}
        <div className="p-4">
          <div className="bg-slate-900/80 backdrop-blur-md rounded-xl p-3.5 border border-slate-800/80 shadow-inner">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Sensors Online
              </span>
              <span className="text-[11px] text-emerald-400 font-mono font-bold">100%</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Real-time API polling active (5s sync).
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 relative">
        {/* Header Bar with Integrated Understated ClassWatch Branding */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 py-3.5 flex items-center justify-between shadow-xs">
          <div>
            {/* Small & Understated ClassWatch Wordmark + Icon */}
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-4 h-4 rounded bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-xs">
                <Zap className="w-2.5 h-2.5" />
              </div>
              <span className="text-[11px] font-extrabold tracking-wider uppercase bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                ClassWatch
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">• Energy Platform</span>
            </div>

            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                ClassWatch — Admin
              </h2>

              {/* Role Dropdown Selector */}
              <div className="relative inline-flex items-center">
                <select
                  value="Admin"
                  onChange={handleRoleChange}
                  className="appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-xs"
                >
                  <option value="Admin">Admin Role</option>
                  <option value="Faculty">Faculty Role</option>
                  <option value="Facilities">Facilities Role</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-indigo-600 absolute right-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search room or block..."
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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-indigo-500/20">
                AD
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-xs font-bold text-slate-800">Admin User</p>
                <p className="text-[10px] text-slate-500">CSE Department</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full relative">
          {/* Subtle Background Glow behind Stat Cards */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-gradient-to-b from-indigo-100/40 via-violet-50/20 to-transparent blur-3xl pointer-events-none -z-10"></div>

          {/* Top Row: 3 Glassmorphism Summary Stat Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stat Card 1: Total kWh Saved */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="p-[1px] bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-cyan-500/20 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="bg-white/85 backdrop-blur-xl p-6 rounded-[15px] h-full flex flex-col justify-between relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Energy Saved
                  </span>
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                    <Zap className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    {(ledger.total_kwh_saved || 1248).toLocaleString()}{' '}
                    <span className="text-lg font-bold text-slate-500">kWh</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+14.2% vs last month</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stat Card 2: Total ₹ Saved */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="p-[1px] bg-gradient-to-br from-emerald-500/30 via-teal-500/20 to-indigo-500/20 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="bg-white/85 backdrop-blur-xl p-6 rounded-[15px] h-full flex flex-col justify-between relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Cost Saved
                  </span>
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    ₹ {(ledger.total_inr_saved || 9984).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Estimated ₹8/kWh rate</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stat Card 3: Total CO2 Saved (kg) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="p-[1px] bg-gradient-to-br from-teal-500/30 via-emerald-500/20 to-violet-500/20 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="bg-white/85 backdrop-blur-xl p-6 rounded-[15px] h-full flex flex-col justify-between relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total CO₂ Saved (kg)
                  </span>
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
                    <Leaf className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    {(ledger.total_co2_saved_kg || 1023).toLocaleString()}{' '}
                    <span className="text-lg font-bold text-slate-500">kg</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-teal-700 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                    <span>Equivalent to 46 trees planted</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Section 2: Room Cards Grid */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  Live Room Status & Power Monitoring
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time sensor telemetry and efficiency scoring per room (5s sync)
                </p>
              </div>

              {/* Building Filter Pills */}
              <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl">
                {['All', 'CSE Block', 'ECE Block'].map((bldg) => (
                  <button
                    key={bldg}
                    onClick={() => setFilterBuilding(bldg)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      filterBuilding === bldg
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {bldg}
                  </button>
                ))}
              </div>
            </div>

            {/* Room Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredRooms.map((room, index) => {
                const badge = getStatusBadge(room.status);
                return (
                  <motion.div
                    key={room.room_id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.08 * index }}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between space-y-4 group cursor-pointer"
                  >
                    {/* Top Row: Room Info & Status Pill */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                            {room.name}
                          </h4>
                          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {room.room_id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {room.building}
                        </p>
                      </div>

                      {/* Status Pill */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${badge.dot}`}
                        ></span>
                        {badge.label}
                      </span>
                    </div>

                    {/* Middle Row: Current Power & Occupancy */}
                    <div className="grid grid-cols-2 gap-3 py-3 px-3.5 bg-slate-50/80 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                          Current Power
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-slate-900">
                            {room.power_watts.toLocaleString()}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            W
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                          Occupancy
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Users
                            className={`w-4 h-4 ${
                              room.occupancy_count > 0
                                ? 'text-indigo-600'
                                : 'text-slate-400'
                            }`}
                          />
                          <span className="text-sm font-bold text-slate-900">
                            {room.occupancy_count}{' '}
                            <span className="text-xs font-normal text-slate-500">
                              {room.occupancy_count === 1 ? 'person' : 'people'}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Gradient Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-600">
                          Efficiency Score
                        </span>
                        <span className="font-extrabold text-slate-900 font-mono">
                          {room.efficiency_score}%
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${room.efficiency_score}%` }}
                          transition={{ duration: 0.8 }}
                          className={`h-full rounded-full ${getEfficiencyGradient(
                            room.efficiency_score
                          )}`}
                        ></motion.div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Section 3: Leaderboard Panel (Two Columns) */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Efficiency Leaderboard Panel
                </h3>
                <p className="text-xs text-slate-500">
                  Benchmarking room performance and identifying target areas for energy conservation
                </p>
              </div>
              <span className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-1">
                View detailed breakdown
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Column 1: Top Performers */}
              <div className="bg-emerald-50/40 rounded-2xl p-5 border border-emerald-200/60 space-y-4">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <span>Top Performers</span>
                </div>

                <div className="space-y-3">
                  {(leaderboard.top || mockLeaderboard.top).map((item, idx) => (
                    <div
                      key={item.room_id || idx}
                      className="bg-white rounded-xl p-4 border border-emerald-100 shadow-xs flex items-center justify-between hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            Room {item.room_id}
                          </p>
                          <p className="text-xs text-slate-500 font-medium">
                            Score: {item.efficiency_score}%
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                          🔥 {item.streak_days_clean || 12} Days Streak
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: Needs Attention */}
              <div className="bg-rose-50/40 rounded-2xl p-5 border border-rose-200/60 space-y-4">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                  <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <span>Needs Attention</span>
                </div>

                <div className="space-y-3">
                  {(leaderboard.bottom || mockLeaderboard.bottom).map((item, idx) => (
                    <div
                      key={item.room_id || idx}
                      className="bg-white rounded-xl p-4 border border-rose-100 shadow-xs flex items-center justify-between hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-400 to-rose-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                          ⚠️
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            Room {item.room_id}
                          </p>
                          <p className="text-xs text-slate-500 font-medium">
                            Score: {item.efficiency_score}%
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100/80 px-2.5 py-1 rounded-lg">
                          🚨 {item.flags_this_week || 6} Flags This Week
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* AI Energy Intelligence NL Query Panel */}
          <NLQueryPanel />
        </div>
      </main>
    </div>
  );
}
