'use client';

import React, { useState } from 'react';
import { User, SecurityLog, UserRole } from '@/lib/types';
import {
  adminUpdateUser,
  adminChangePassword,
  adminCreateUser,
  adminDeleteUser,
  getSecurityLogs,
} from '@/lib/storage';
import { UserEditModal } from './UserEditModal';
import { PasswordResetModal } from './PasswordResetModal';
import { UserCreateModal } from './UserCreateModal';
import {
  Shield,
  Users,
  UserPlus,
  KeyRound,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Search,
  Activity,
  Lock,
  Cpu,
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: User;
  users: User[];
  onBackToBoard: () => void;
  onRefreshData: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  users,
  onBackToBoard,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'security'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>(() => getSecurityLogs());

  // Modal controls
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUserForEdit(user);
    setIsEditModalOpen(true);
  };

  const handleOpenPassword = (user: User) => {
    setSelectedUserForPassword(user);
    setIsPasswordModalOpen(true);
  };

  const handleSaveEditUser = async (
    targetUserId: string,
    updates: {
      name: string;
      email: string;
      avatar: string;
      role: UserRole;
      isActive: boolean;
    }
  ) => {
    const res = await adminUpdateUser(currentUser, targetUserId, updates);
    if (res.success) {
      showNotification('success', 'REGISTRO//USUARIO ACTUALIZADO CON ÉXITO.');
      onRefreshData();
      setSecurityLogs(getSecurityLogs());
    } else {
      showNotification('error', res.error || 'ERROR AL ACTUALIZAR REGISTRO.');
    }
  };

  const handleSaveResetPassword = async (targetUserId: string, newPass: string) => {
    const res = await adminChangePassword(currentUser, targetUserId, newPass);
    if (res.success) {
      showNotification('success', 'CLAVE//CRIPTO-HASH ACTUALIZADO.');
      onRefreshData();
      setSecurityLogs(getSecurityLogs());
      return true;
    } else {
      showNotification('error', res.error || 'ERROR AL RESTABLECER CLAVE.');
      return false;
    }
  };

  const handleCreateUser = async (data: {
    name: string;
    email: string;
    passwordPlain: string;
    role: UserRole;
    avatar?: string;
  }) => {
    const res = await adminCreateUser(currentUser, data);
    if (res.success) {
      showNotification('success', `OPERADOR [${data.name.toUpperCase()}] DADO DE ALTA.`);
      onRefreshData();
      setSecurityLogs(getSecurityLogs());
      return true;
    } else {
      showNotification('error', res.error || 'ERROR AL CREAR OPERADOR.');
      return false;
    }
  };

  const handleDeleteUser = async (targetUser: User) => {
    if (confirm(`¿CONFIRMAS LA PURGA DEL USUARIO "${targetUser.name}"? ESTA ACCIÓN ES IRREVERSIBLE.`)) {
      const res = await adminDeleteUser(currentUser, targetUser.id);
      if (res.success) {
        showNotification('success', `OPERADOR ${targetUser.name} PURGADO DEL SISTEMA.`);
        onRefreshData();
        setSecurityLogs(getSecurityLogs());
      } else {
        showNotification('error', res.error || 'ERROR AL ELIMINAR.');
      }
    }
  };

  const handleToggleActive = async (targetUser: User) => {
    const res = await adminUpdateUser(currentUser, targetUser.id, {
      isActive: !targetUser.isActive,
    });
    if (res.success) {
      showNotification(
        'success',
        `ESTADO DE ${targetUser.name.toUpperCase()}: ${!targetUser.isActive ? 'ACTIVO//HABILITADO' : 'SUSPENDIDO//OFFLINE'}.`
      );
      onRefreshData();
      setSecurityLogs(getSecurityLogs());
    } else {
      showNotification('error', res.error || 'ERROR AL CAMBIAR ESTADO.');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const totalAdmins = users.filter((u) => u.role === 'admin').length;
  const totalActive = users.filter((u) => u.isActive).length;

  return (
    <div className="min-h-screen bg-[#080a11] text-slate-200 selection:bg-cyan-500 selection:text-black pb-16 font-mono">
      {/* Top Header */}
      <header className="bg-[#0b0e17]/90 border-b border-cyan-500/30 sticky top-0 z-30 shadow-[0_4px_25px_rgba(0,0,0,0.6)] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={onBackToBoard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:text-black hover:bg-cyan-400 bg-cyan-950/40 border border-cyan-500/40 rounded-xl transition-all uppercase tracking-wider shadow-[0_0_10px_rgba(6,182,212,0.15)]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>// TABLERO</span>
              </button>

              <div className="h-5 w-[1px] bg-slate-800 hidden sm:block"></div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-500/50 text-indigo-400 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.3)]">
                  <Shield className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-sm sm:text-base font-black text-white leading-none uppercase tracking-wider">
                    CONSOLE//ADMIN <span className="text-cyan-400">// OMEGA</span>
                  </h1>
                  <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-widest">
                    // CONTROL DE IDENTIDADES, CRIPTO-CLAVES Y TELEMETRÍA
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black px-3.5 py-2 rounded-xl text-xs font-bold shadow-[0_0_18px_rgba(6,182,212,0.35)] transition-all uppercase tracking-wider active:scale-98"
              >
                <UserPlus className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline">ALTA//OPERADOR</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Toast Notification */}
        {notification && (
          <div
            className={`mb-6 p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 uppercase tracking-wider animate-in fade-in slide-in-from-top-2 ${
              notification.type === 'success'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : 'bg-rose-950/60 text-rose-300 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Stats KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#0b0e18]/90 p-5 rounded-2xl border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                // TOTAL OPERADORES
              </span>
              <div className="p-2 bg-cyan-950/80 text-cyan-400 border border-cyan-500/40 rounded-xl">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-white mt-2 tracking-tight">{users.length}</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase">
              {totalActive} Nodos Activos en Red
            </p>
          </div>

          <div className="bg-[#0b0e18]/90 p-5 rounded-2xl border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                // ACCESO OMEGA (ADMINS)
              </span>
              <div className="p-2 bg-indigo-950/80 text-indigo-400 border border-indigo-500/40 rounded-xl">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-white mt-2 tracking-tight">{totalAdmins}</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase">Privilegios de Nivel Máximo</p>
          </div>

          <div className="bg-[#0b0e18]/90 p-5 rounded-2xl border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                // AUDITORÍA Y EVENTOS
              </span>
              <div className="p-2 bg-amber-950/80 text-amber-400 border border-amber-500/40 rounded-xl">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-white mt-2 tracking-tight">{securityLogs.length}</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase">Eventos Criptográficos Registrados</p>
          </div>
        </div>

        {/* Tab Navigation & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1.5 p-1 bg-[#090c14] rounded-xl border border-slate-800 w-fit">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'users'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>// OPERADORES ({users.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('security');
                setSecurityLogs(getSecurityLogs());
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'security'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                  : 'text-slate-400 hover:text-indigo-300'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>// AUDITORÍA DE SEGURIDAD</span>
            </button>
          </div>

          {activeTab === 'users' && (
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="FILTRAR POR ID O NOMBRE..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-[#101422] border border-slate-700 text-white rounded-xl focus:outline-none focus:border-cyan-400 shadow-2xs uppercase tracking-wider placeholder:text-slate-600"
              />
            </div>
          )}
        </div>

        {/* Tab 1: Users Management Table */}
        {activeTab === 'users' && (
          <div className="bg-[#0b0e18]/90 border border-cyan-500/25 rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.7)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#07090f] text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                    <th className="py-3.5 px-6">Identidad & Avatar</th>
                    <th className="py-3.5 px-6">Nivel de Acceso</th>
                    <th className="py-3.5 px-6">Estado del Nodo</th>
                    <th className="py-3.5 px-6">Última Telemetría</th>
                    <th className="py-3.5 px-6 text-right">Comandos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Avatar, Name & Email */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-11 h-11 rounded-xl object-cover ring-1 ring-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                          />
                          <div>
                            <p className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{user.name}</span>
                              {user.id === currentUser.id && (
                                <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded font-bold uppercase">
                                  TÚ
                                </span>
                              )}
                            </p>
                            <p className="text-slate-400 text-[11px] font-mono">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-6">
                        {user.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/60 px-2.5 py-1 rounded-full uppercase tracking-wider shadow-[0_0_8px_rgba(99,102,241,0.25)]">
                            <Shield className="w-3 h-3 text-indigo-400" />
                            ADMINISTRADOR
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/60 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            <Users className="w-3 h-3 text-cyan-400" />
                            COLABORADOR
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-6">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            ACTIVO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-rose-400 bg-rose-950/80 border border-rose-500/50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                            SUSPENDIDO
                          </span>
                        )}
                      </td>

                      {/* Last Login */}
                      <td className="py-4 px-6 text-slate-400 text-[11px] font-mono">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'SIN_REGISTRO'}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(user)}
                            title="Editar nombre, foto o rol"
                            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/40 rounded-xl transition-colors border border-transparent hover:border-cyan-500/40"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => handleOpenPassword(user)}
                            title="Cambiar contraseña de este usuario"
                            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-950/40 rounded-xl transition-colors border border-transparent hover:border-amber-500/40"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Suspend / Activate */}
                          {user.id !== currentUser.id && (
                            <button
                              onClick={() => handleToggleActive(user)}
                              title={user.isActive ? 'Suspender acceso' : 'Activar acceso'}
                              className={`p-2 rounded-xl transition-colors border border-transparent ${
                                user.isActive
                                  ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 hover:border-rose-500/40'
                                  : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40 hover:border-emerald-500/40'
                              }`}
                            >
                              {user.isActive ? (
                                <XCircle className="w-4 h-4" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {/* Delete User */}
                          {user.id !== currentUser.id && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              title="Purgar usuario permanentemente"
                              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors border border-transparent hover:border-rose-500/40"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Security & Audit Logs */}
        {activeTab === 'security' && (
          <div className="bg-[#0b0e18]/90 border border-cyan-500/25 rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.7)] p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              // BITÁCORA DE CRIPTO-SEGURIDAD & TELEMETRÍA
            </h3>
            <p className="text-xs text-slate-400 mb-6 uppercase tracking-wider">
              Historial inmutable de modificaciones de contraseñas, fotos, usuarios y accesos.
            </p>

            <div className="space-y-3">
              {securityLogs.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No hay registros de seguridad aún.</p>
              ) : (
                securityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-xl bg-[#090b14] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-cyan-300 bg-cyan-950 border border-cyan-500/50 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                          {log.action}
                        </span>
                        <span className="font-bold text-white uppercase">
                          {log.adminName}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        {log.details}
                      </p>
                    </div>
                    <span className="text-[10px] text-cyan-400/70 shrink-0 font-mono">
                      {new Date(log.timestamp).toLocaleString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Edit User Modal */}
      <UserEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={selectedUserForEdit}
        onSave={handleSaveEditUser}
      />

      {/* Password Reset Modal */}
      <PasswordResetModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        user={selectedUserForPassword}
        onResetPassword={handleSaveResetPassword}
      />

      {/* User Create Modal */}
      <UserCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateUser}
      />
    </div>
  );
};
