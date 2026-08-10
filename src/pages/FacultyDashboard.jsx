import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Bell,
  Settings,
  Zap,
  Users,
  AlertTriangle,
  CheckCircle2,
  Search,
  Building2,
  Activity,
  Clock,
  BookOpen,
  ChevronDown,
  Calendar,
  Sparkles
} from 'lucide-react';
import { mockRooms } from '../mockData/rooms';
import { mockTimetable } from '../mockData/timetable';
import { fetchRooms, fetchTimetable } from '../services/api';
import NLQueryPanel from '../components/NLQueryPanel';

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('My Rooms');
  const [searchQuery, setSearchQuery] = useState('');
  const [nudgeSent, setNudgeSent] = useState(false);

  // Real API state with mock defaults
  const [rooms, setRooms] = useState(mockRooms);
  const [timetable, setTimetable] = useState(mockTimetable);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const roomsData = await fetchRooms();
        if (isMounted && roomsData) setRooms(roomsData);
      } catch (err) {
        console.error('Error loading rooms for Faculty:', err);
      }

      try {
        const ttData = await fetchTimetable();
        if (isMounted && ttData) setTimetable(ttData);
      } catch (err) {
        console.error('Error loading timetable for Faculty:', err);
      }
    };

    loadData();

    // 5-second polling for live room updates
    const interval = setInterval(async () => {
      try {
        const updatedRooms = await fetchRooms();
        if (isMounted && updatedRooms) setRooms(updatedRooms);
      } catch (err) {
        console.error('Error polling rooms for Faculty:', err);
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

  // Filter rooms assigned to this faculty member (Room R204)
  const facultyRooms = rooms.filter((room) => room.room_id === 'R204');

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

  const triggerNudge = (roomId) => {
    setNudgeSent(true);
    setTimeout(() => setNudgeSent(false), 3000);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Sidebar with Gradient Background */}
      <aside className="w-64 bg-gradient-to-b from-[#0f172a] via-[#131d38] to-[#1a2547] text-slate-300 flex flex-col justify-between flex-shrink-0 shadow-2xl relative z-20 overflow-hidden">
        {/* Top Slim Gradient Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"></div>

        <div className="p-4 pt-6 space-y-6">
          {/* Sidebar Nav (My Rooms, Alerts, Settings) */}
          <nav className="space-y-1.5">
            {[
              { name: 'My Rooms', icon: LayoutDashboard, badge: null },
              { name: 'Alerts', icon: Bell, badge: '1' },
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
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
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
                Faculty Telemetry
              </span>
              <span className="text-[11px] text-emerald-400 font-mono font-bold">R204 Sync</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Assigned to Prof. Dr. Sharma (CSE)
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 relative">
        {/* Header Bar with Role Switcher Dropdown */}
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
              <span className="text-[10px] text-slate-400 font-semibold">• Faculty Portal</span>
            </div>

            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                ClassWatch — Faculty
              </h2>

              {/* Role Dropdown Selector */}
              <div className="relative inline-flex items-center">
                <select
                  value="Faculty"
                  onChange={handleRoleChange}
                  className="appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200/80 focus:outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer shadow-xs"
                >
                  <option value="Admin">Admin Role</option>
                  <option value="Faculty">Faculty Role</option>
                  <option value="Facilities">Facilities Role</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-violet-600 absolute right-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search classes or rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 text-sm bg-slate-100/80 hover:bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Profile & Notifications */}
            <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500"></span>
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3 pl-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-violet-500/20">
                F12
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-xs font-bold text-slate-800">Prof. Sharma</p>
                <p className="text-[10px] text-slate-500">CSE Faculty</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full relative">
          {/* Toast Notification for Nudge */}
          {nudgeSent && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-amber-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between font-medium text-sm border border-amber-400"
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 animate-bounce" />
                <span>Nudge alert dispatched to Room 204 display & mobile notifications!</span>
              </div>
              <span className="text-xs font-bold bg-amber-600 px-2 py-0.5 rounded">Sent</span>
            </motion.div>
          )}

          {/* Section 1: Today's Classes Panel (Replaces Stat Cards Row) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Today's Scheduled Classes
                </h3>
                <p className="text-xs text-slate-500">
                  Timetable schedule and active room allocations for today
                </p>
              </div>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Monday Schedule
              </span>
            </div>

            {/* Horizontal List of Glassmorphism Class Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {timetable.map((session, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.08 * index }}
                  className="p-[1px] bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-cyan-500/20 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="bg-white/85 backdrop-blur-xl p-5 rounded-[15px] h-full flex flex-col justify-between space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{session.start} - {session.end}</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {session.room_id}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-violet-600" />
                        {session.course}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Faculty ID: <span className="font-mono font-semibold text-slate-700">{session.faculty_id}</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-emerald-600">
                        <Sparkles className="w-3.5 h-3.5" />
                        HVAC Pre-cooled
                      </span>
                      <span className="font-semibold text-slate-700">60 mins</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Section 2: My Assigned Rooms with Nudge Action Button */}
          <section className="space-y-4 pt-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                My Assigned Room Monitoring
              </h3>
              <p className="text-xs text-slate-500">
                Live energy consumption & active wastage status for your allocated classroom (5s sync)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {facultyRooms.map((room) => {
                const badge = getStatusBadge(room.status);
                return (
                  <motion.div
                    key={room.room_id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-xl transition-all duration-200 space-y-5"
                  >
                    {/* Top Header & Status */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-lg">
                            {room.name}
                          </h4>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {room.room_id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {room.building}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${badge.dot}`}
                        ></span>
                        {badge.label}
                      </span>
                    </div>

                    {/* Middle Telemetry */}
                    <div className="grid grid-cols-2 gap-4 py-4 px-4 bg-slate-50/80 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Current Power Usage
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-slate-900">
                            {room.power_watts.toLocaleString()}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            W
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                          Occupancy
                        </span>
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-slate-400" />
                          <span className="text-base font-bold text-slate-900">
                            {room.occupancy_count}{' '}
                            <span className="text-xs font-normal text-slate-500">
                              {room.occupancy_count === 1 ? 'person' : 'people'}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Efficiency Progress Bar */}
                    <div className="space-y-2">
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

                    {/* Action Bar with Nudge Button */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        High power detected with 0 occupants
                      </span>

                      {/* Outlined Nudge Button */}
                      <button
                        onClick={() => triggerNudge(room.room_id)}
                        className="px-4 py-2 border border-amber-400 text-amber-700 bg-amber-50/60 hover:bg-amber-100/80 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        <Bell className="w-3.5 h-3.5 text-amber-600" />
                        <span>Nudge Occupants</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* AI Energy Intelligence NL Query Panel */}
          <NLQueryPanel />
        </div>
      </main>
    </div>
  );
}
