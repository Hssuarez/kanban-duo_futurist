'use client';

import React, { useState } from 'react';
import { User, SpaceFilter } from '@/lib/types';
import {
  Kanban,
  Plus,
  Search,
  ChevronDown,
  LayoutGrid,
  User as UserIcon,
  Users,
  Shield,
  LogOut,
  Settings,
  Cpu,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  users: User[];
  spaceFilter: SpaceFilter;
  setSpaceFilter: (filter: SpaceFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenNewTaskModal: () => void;
  onOpenAdminPanel: () => void;
  onOpenProfileModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  users,
  spaceFilter,
  setSpaceFilter,
  searchQuery,
  setSearchQuery,
  onOpenNewTaskModal,
  onOpenAdminPanel,
  onOpenProfileModal,
  onLogout,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const peerUser = users.find((u) => u.id !== currentUser.id) || users[0];

  return (
    <header className="sticky top-0 z-30 bg-[#0b0e17]/90 backdrop-blur-md border-b border-cyan-500/20 shadow-[0_4px_25px_rgba(0,0,0,0.5)] font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-fuchsia-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/40">
              <Kanban className="w-5 h-5 text-cyan-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-white text-base sm:text-lg tracking-wider uppercase">
                  KANBAN<span className="text-cyan-400">//DUO</span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <Cpu className="w-3 h-3 text-cyan-400" /> VERCEL_READY
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block tracking-wider uppercase">
                // PROTOCOLO COLABORATIVO CYBERPUNK
              </p>
            </div>
          </div>

          {/* Search Bar (center) */}
          <div className="flex-1 max-w-xs md:max-w-sm hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="BUSCAR TAREA O FILTRAR..."
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#111420] border border-slate-700/80 text-white rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-all placeholder:text-slate-500 tracking-wider"
              />
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Admin Panel Button */}
            {currentUser.role === 'admin' && (
              <button
                onClick={onOpenAdminPanel}
                title="Abrir Panel de Administración"
                className="inline-flex items-center gap-1.5 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-500/50 hover:border-indigo-400 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-[0_0_12px_rgba(99,102,241,0.2)] tracking-wider uppercase"
              >
                <Shield className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">CONSOLE//ADMIN</span>
              </button>
            )}

            {/* New Task Button */}
            <button
              onClick={onOpenNewTaskModal}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black px-3.5 py-2 rounded-xl text-xs font-bold shadow-[0_0_18px_rgba(6,182,212,0.35)] transition-all uppercase tracking-wider active:scale-98"
            >
              <Plus className="w-4 h-4 text-black stroke-[3]" />
              <span className="hidden sm:inline">NUEVA TAREA</span>
            </button>

            {/* Current User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 bg-[#111420] hover:bg-[#181d2e] border border-cyan-500/30 rounded-xl text-xs font-medium text-slate-200 transition-colors shadow-sm"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-md object-cover ring-1 ring-cyan-400"
                />
                <span className="hidden sm:inline font-bold text-slate-200">
                  {currentUser.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
              </button>

              {/* User Dropdown */}
              {showUserDropdown && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-[#0e121e]/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.8)] py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-200"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <div className="px-4 py-2.5 border-b border-cyan-500/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-cyan-400/80 font-bold uppercase tracking-widest">
                        OPERADOR//ACTIVO
                      </span>
                      {currentUser.role === 'admin' ? (
                        <span className="text-[10px] bg-indigo-950 text-indigo-300 font-bold px-1.5 py-0.5 rounded border border-indigo-500/50 uppercase">
                          ADMIN
                        </span>
                      ) : (
                        <span className="text-[10px] bg-cyan-950 text-cyan-300 font-bold px-1.5 py-0.5 rounded border border-cyan-500/50 uppercase">
                          OPERATIVO
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={onOpenProfileModal}
                      className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:text-cyan-400 hover:bg-cyan-950/40 font-medium flex items-center gap-2 transition-colors uppercase tracking-wider"
                    >
                      <Settings className="w-4 h-4 text-cyan-400" />
                      <span>// MI PERFIL (FOTO, CLAVE)</span>
                    </button>

                    {currentUser.role === 'admin' && (
                      <button
                        onClick={onOpenAdminPanel}
                        className="w-full text-left px-4 py-2 text-xs text-indigo-300 hover:text-indigo-200 hover:bg-indigo-950/40 font-bold flex items-center gap-2 transition-colors uppercase tracking-wider"
                      >
                        <Shield className="w-4 h-4 text-indigo-400" />
                        <span>// PANEL ADMIN</span>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-cyan-500/20 pt-1 mt-1">
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-950/40 font-bold flex items-center gap-2 transition-colors uppercase tracking-wider"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>CERRAR SESIÓN</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Space Navigation Tabs */}
        <div className="flex items-center justify-between border-t border-cyan-500/10 py-2.5 overflow-x-auto no-scrollbar gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-[#090c14] rounded-xl border border-slate-800">
            <button
              onClick={() => setSpaceFilter('mine')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${
                spaceFilter === 'mine'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/40'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>// MI ESPACIO</span>
            </button>

            <button
              onClick={() => setSpaceFilter('peer')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${
                spaceFilter === 'peer'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                  : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800/40'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>// ESPACIO DE {peerUser?.name?.split(' ')[0] || 'PEER'}</span>
            </button>

            <button
              onClick={() => setSpaceFilter('all')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${
                spaceFilter === 'all'
                  ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/50 shadow-[0_0_12px_rgba(217,70,239,0.3)]'
                  : 'text-slate-400 hover:text-fuchsia-300 hover:bg-slate-800/40'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>// EQUIPO COMPLETO</span>
            </button>
          </div>

          <div className="text-[11px] text-emerald-400 hidden sm:flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>SYNC//BROADCAST_ACTIVO</span>
          </div>
        </div>
      </div>
    </header>
  );
};
