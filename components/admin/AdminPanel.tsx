'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { User, SecurityLog, UserRole } from '@/lib/types';
import {
  adminUpdateUser,
  adminChangePassword,
  adminCreateUser,
  adminDeleteUser,
  getSecurityLogs,
  syncCloudSecurityLogs,
  syncCloudUsers,
  subscribeToSync,
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
  Smartphone,
  Laptop,
  Globe,
  Filter,
  Radio,
  RefreshCw,
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
  const [securityFilterAction, setSecurityFilterAction] = useState<string>('all');
  const [securitySearchQuery, setSecuritySearchQuery] = useState('');
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>(() => getSecurityLogs());

  // In-row delete confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
      showNotification('success', 'Usuario actualizado correctamente.');
      onRefreshData();
      setSecurityLogs(getSecurityLogs());
    } else {
      showNotification('error', res.error || 'Error al actualizar usuario.');
    }
  };

  const handleSaveResetPassword = async (targetUserId: string, newPass: string) => {
    const res = await adminChangePassword(currentUser, targetUserId, newPass);
    if (res.success) {
      showNotification('success', 'Contraseña actualizada con éxito.');
      onRefreshData();
      setSecurityLogs(getSecurityLogs());
      return true;
    } else {
      showNotification('error', res.error || 'Error al restablecer la contraseña.');
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
      showNotification('success', `Usuario "${data.name}" creado con éxito.`);
      onRefreshData();
      setSecurityLogs(getSecurityLogs());
      return true;
    } else {
      showNotification('error', res.error || 'Error al crear usuario.');
      return false;
    }
  };

  const handleDeleteUser = async (targetUser: User) => {
    const res = await adminDeleteUser(currentUser, targetUser.id);
    if (res.success) {
      showNotification('success', `Usuario ${targetUser.name} eliminado del sistema.`);
      setConfirmDeleteId(null);
      onRefreshData();
      setSecurityLogs(getSecurityLogs());
    } else {
      showNotification('error', res.error || 'Error al eliminar usuario.');
    }
  };

  const handleToggleActive = async (targetUser: User) => {
    const res = await adminUpdateUser(currentUser, targetUser.id, {
      isActive: !targetUser.isActive,
    });
    if (res.success) {
      showNotification(
        'success',
        `${targetUser.name} ahora está ${!targetUser.isActive ? 'activo' : 'suspendido'}.`
      );
      onRefreshData();
      setSecurityLogs(getSecurityLogs());
    } else {
      showNotification('error', res.error || 'Error al cambiar estado.');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const totalAdmins = users.filter((u) => u.role === 'admin').length;
  const totalActive = users.filter((u) => u.isActive).length;
  const [isSyncingLogs, setIsSyncingLogs] = useState(false);

  const handleRefreshSecurityLogs = async () => {
    setIsSyncingLogs(true);
    try {
      const logs = await syncCloudSecurityLogs();
      setSecurityLogs(logs);
      await syncCloudUsers();
      onRefreshData();
    } catch (e) {
      console.warn('Error refrescando logs de seguridad:', e);
    } finally {
      setIsSyncingLogs(false);
    }
  };

  useEffect(() => {
    handleRefreshSecurityLogs();
    const unsubscribe = subscribeToSync((type) => {
      if (type === 'security' || type === 'users') {
        setSecurityLogs(getSecurityLogs());
      }
    });
    return () => unsubscribe();
  }, [activeTab]);

  // Security Metrics & KPIs
  const totalSecurityEvents = securityLogs.length;

  const mobileCount = useMemo(() => {
    return securityLogs.filter((log) => {
      if (log.deviceType === 'mobile' || log.deviceType === 'tablet') return true;
      if (log.deviceName && /phone|móvil|galaxy|pixel|redmi|iphone|android|tablet|ipad/i.test(log.deviceName)) return true;
      if (log.details && /phone|móvil|galaxy|pixel|redmi|iphone|android/i.test(log.details)) return true;
      return false;
    }).length;
  }, [securityLogs]);

  const desktopCount = useMemo(() => {
    return Math.max(0, totalSecurityEvents - mobileCount);
  }, [totalSecurityEvents, mobileCount]);

  const uniqueIpsCount = useMemo(() => {
    const ips = new Set<string>();
    securityLogs.forEach((log) => {
      if (log.ip) ips.add(log.ip);
    });
    return ips.size || (securityLogs.length > 0 ? 1 : 0);
  }, [securityLogs]);

  const latestIp = useMemo(() => {
    const logWithIp = securityLogs.find((l) => l.ip);
    return logWithIp ? `${logWithIp.ip}${logWithIp.city ? ` (${logWithIp.city})` : ''}` : '127.0.0.1';
  }, [securityLogs]);

  // Filtered Security Logs
  const filteredSecurityLogs = useMemo(() => {
    return securityLogs.filter((log) => {
      // 1. Action filter
      if (securityFilterAction === 'login' && !log.action.toLowerCase().includes('inicio')) {
        return false;
      }
      if (securityFilterAction === 'logout' && !log.action.toLowerCase().includes('cierre')) {
        return false;
      }
      if (securityFilterAction === 'credentials' && !log.action.toLowerCase().includes('contraseña')) {
        return false;
      }
      if (securityFilterAction === 'management' && !log.action.toLowerCase().includes('usuario')) {
        return false;
      }

      // 2. Search query filter
      if (securitySearchQuery.trim()) {
        const q = securitySearchQuery.toLowerCase().trim();
        const matchAction = log.action.toLowerCase().includes(q);
        const matchAdmin = log.adminName.toLowerCase().includes(q);
        const matchDetails = log.details.toLowerCase().includes(q);
        const matchIp = log.ip?.toLowerCase().includes(q);
        const matchCity = log.city?.toLowerCase().includes(q);
        const matchDevice = log.deviceName?.toLowerCase().includes(q);
        const matchOs = log.os?.toLowerCase().includes(q);
        const matchBrowser = log.browser?.toLowerCase().includes(q);

        return (
          matchAction ||
          matchAdmin ||
          matchDetails ||
          matchIp ||
          matchCity ||
          matchDevice ||
          matchOs ||
          matchBrowser
        );
      }

      return true;
    });
  }, [securityLogs, securityFilterAction, securitySearchQuery]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans pb-16 selection:bg-white selection:text-zinc-900">
      {/* Top Header */}
      <header className="bg-zinc-950/80 border-b border-white/[0.08] sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Left: Back button & Title */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <button
                onClick={onBackToBoard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] rounded-lg transition-colors active:scale-[0.98] shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Volver al tablero</span>
                <span className="sm:hidden">Volver</span>
              </button>

              <div className="h-4 w-[1px] bg-white/[0.08] hidden sm:block" />

              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.08] text-zinc-300 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-purple-400" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-base font-semibold text-white tracking-tight truncate">
                    Panel de administración
                  </h1>
                  <p className="text-[11px] text-zinc-500 truncate hidden sm:block">
                    Gestión de usuarios y auditoría de seguridad
                  </p>
                </div>
              </div>
            </div>

            {/* Right: New operator button */}
            <div className="flex items-center shrink-0">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-white text-zinc-950 hover:bg-zinc-200 px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-all active:scale-[0.98] shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Nuevo usuario</span>
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
            className={`mb-6 p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 animate-fade-in ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Stats KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-zinc-900/40 p-4 sm:p-5 rounded-xl border border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Total usuarios
              </span>
              <div className="p-2 bg-zinc-800/80 text-zinc-400 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-white mt-2 font-mono tracking-tight">
              {users.length}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {totalActive} activos en la plataforma
            </p>
          </div>

          <div className="bg-zinc-900/40 p-4 sm:p-5 rounded-xl border border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Administradores
              </span>
              <div className="p-2 bg-zinc-800/80 text-purple-400 rounded-lg">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-white mt-2 font-mono tracking-tight">
              {totalAdmins}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Privilegios totales</p>
          </div>

          <div className="bg-zinc-900/40 p-4 sm:p-5 rounded-xl border border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Auditoría y eventos
              </span>
              <div className="p-2 bg-zinc-800/80 text-amber-400 rounded-lg">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-white mt-2 font-mono tracking-tight">
              {securityLogs.length}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Registros de seguridad</p>
          </div>
        </div>

        {/* Tab Navigation & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
          <div className="inline-flex p-1 bg-zinc-900/80 rounded-xl border border-white/[0.08] w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'users'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Usuarios ({users.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('security');
                setSecurityLogs(getSecurityLogs());
              }}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'security'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Auditoría de seguridad</span>
            </button>
          </div>

          {activeTab === 'users' && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o correo..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-zinc-900/80 border border-white/[0.08] text-white rounded-lg focus:outline-none focus:border-white/30 placeholder:text-zinc-600 transition-colors"
              />
            </div>
          )}
        </div>

        {/* Tab 1: Users Management Table */}
        {activeTab === 'users' && (
          <div className="bg-zinc-900/40 border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[620px]">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-zinc-900/80 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-5">Usuario</th>
                    <th className="py-3 px-5">Rol</th>
                    <th className="py-3 px-5">Estado</th>
                    <th className="py-3 px-5">Último acceso</th>
                    <th className="py-3 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-xs">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-zinc-900/50 transition-colors"
                    >
                      {/* Avatar, Name & Email */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-9 h-9 rounded-lg object-cover ring-1 ring-white/10"
                          />
                          <div>
                            <p className="font-semibold text-white text-xs flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {user.id === currentUser.id && (
                                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded font-medium">
                                  Tú
                                </span>
                              )}
                            </p>
                            <p className="text-zinc-500 text-[11px] font-mono">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-5">
                        {user.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
                            <Shield className="w-3 h-3 text-purple-400" />
                            Administrador
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-white/[0.06] px-2.5 py-0.5 rounded-full">
                            <Users className="w-3 h-3 text-zinc-400" />
                            Colaborador
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-5">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Suspendido
                          </span>
                        )}
                      </td>

                      {/* Last Login & Device/IP Audit */}
                      <td className="py-3.5 px-5 text-zinc-400 text-xs">
                        {user.lastLogin ? (
                          <div className="flex flex-col gap-1.5">
                            <span className="font-mono text-zinc-200 text-xs">
                              {new Date(user.lastLogin).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {user.lastLoginDevice && (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded-md border border-white/[0.06]"
                                  title={user.lastLoginDevice}
                                >
                                  {/phone|móvil|galaxy|pixel|redmi|iphone|android|tablet|ipad/i.test(user.lastLoginDevice) ? (
                                    <Smartphone className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                                  ) : (
                                    <Laptop className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                                  )}
                                  <span className="max-w-[130px] truncate">{user.lastLoginDevice}</span>
                                </span>
                              )}
                              {user.lastLoginIp && (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-500/20 font-mono"
                                  title={`IP: ${user.lastLoginIp}${user.lastLoginCity ? ` · ${user.lastLoginCity}` : ''}`}
                                >
                                  <Globe className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                                  <span>{user.lastLoginIp}</span>
                                  {user.lastLoginCity && (
                                    <span className="text-zinc-400 font-sans truncate max-w-[80px]">
                                      · {user.lastLoginCity}
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="font-mono text-zinc-600 text-xs">—</span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-5 text-right">
                        {confirmDeleteId === user.id ? (
                          <div className="flex items-center justify-end gap-1.5 animate-fade-in">
                            <span className="text-[11px] text-rose-400 font-medium mr-1">¿Eliminar?</span>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="px-2 py-1 text-[11px] font-medium bg-rose-500 text-white hover:bg-rose-600 rounded-md transition-colors"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 text-[11px] font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-md transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEdit(user)}
                              title="Editar usuario"
                              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Reset Password */}
                            <button
                              onClick={() => handleOpenPassword(user)}
                              title="Cambiar contraseña"
                              className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            {/* Suspend / Activate */}
                            {user.id !== currentUser.id && (
                              <button
                                onClick={() => handleToggleActive(user)}
                                title={user.isActive ? 'Suspender cuenta' : 'Activar cuenta'}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  user.isActive
                                    ? 'text-zinc-400 hover:text-rose-400 hover:bg-zinc-800'
                                    : 'text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800'
                                }`}
                              >
                                {user.isActive ? (
                                  <XCircle className="w-3.5 h-3.5" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            {/* Delete User */}
                            {user.id !== currentUser.id && (
                              <button
                                onClick={() => setConfirmDeleteId(user.id)}
                                title="Eliminar usuario"
                                className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
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
          <div className="space-y-6">
            {/* Header & Status */}
            <div className="bg-zinc-900/40 border border-white/[0.08] rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    Auditoría de Acceso, IPs y Dispositivos
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Supervisión de conexiones, huellas digitales de dispositivos, direcciones IP y eventos críticos de seguridad.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
                  <button
                    onClick={handleRefreshSecurityLogs}
                    disabled={isSyncingLogs}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-60 text-zinc-300 hover:text-white text-xs rounded-lg border border-white/[0.08] transition-colors shadow-sm"
                    title="Sincronizar eventos desde Supabase Cloud"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncingLogs ? 'animate-spin text-purple-400' : ''}`} />
                    <span>{isSyncingLogs ? 'Sincronizando...' : 'Actualizar'}</span>
                  </button>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-full font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Auditoría Activa</span>
                  </div>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Total eventos</span>
                    <div className="p-1.5 bg-zinc-800/80 text-purple-400 rounded-lg">
                      <Activity className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-semibold text-white mt-1.5 font-mono">{totalSecurityEvents}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Registros auditados</p>
                </div>

                <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Dispositivos</span>
                    <div className="p-1.5 bg-zinc-800/80 text-sky-400 rounded-lg">
                      <Smartphone className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-semibold text-white mt-1.5 font-mono">
                    {mobileCount} <span className="text-xs font-normal text-zinc-400">móvil</span> · {desktopCount} <span className="text-xs font-normal text-zinc-400">PC</span>
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Distribución de clientes</p>
                </div>

                <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">IPs Públicas</span>
                    <div className="p-1.5 bg-zinc-800/80 text-indigo-400 rounded-lg">
                      <Globe className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-semibold text-white mt-1.5 font-mono">{uniqueIpsCount}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Puntos de conexión detectados</p>
                </div>

                <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Última IP</span>
                    <div className="p-1.5 bg-zinc-800/80 text-emerald-400 rounded-lg">
                      <Radio className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-white mt-2 font-mono truncate" title={latestIp}>
                    {latestIp}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Última actividad capturada</p>
                </div>
              </div>
            </div>

            {/* Filter & Search Toolbar + Log Feed */}
            <div className="bg-zinc-900/40 border border-white/[0.08] rounded-xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                {/* Filter pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'login', label: 'Inicios de sesión' },
                    { id: 'logout', label: 'Cierres de sesión' },
                    { id: 'credentials', label: 'Contraseñas' },
                    { id: 'management', label: 'Usuarios' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSecurityFilterAction(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        securityFilterAction === tab.id
                          ? 'bg-zinc-800 text-white border border-white/20'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search input */}
                <div className="relative w-full md:w-72 shrink-0">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={securitySearchQuery}
                    onChange={(e) => setSecuritySearchQuery(e.target.value)}
                    placeholder="Buscar por IP, dispositivo o usuario..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900/90 border border-white/[0.08] text-white rounded-lg focus:outline-none focus:border-white/30 placeholder:text-zinc-600 transition-colors"
                  />
                </div>
              </div>

              {/* Logs List */}
              <div className="space-y-3">
                {filteredSecurityLogs.length === 0 ? (
                  <div className="py-12 text-center">
                    <Shield className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <p className="text-xs text-zinc-400 font-medium">No se encontraron eventos coincidentes</p>
                    <p className="text-[11px] text-zinc-600 mt-1">Prueba ajustando los filtros de búsqueda o categoría.</p>
                  </div>
                ) : (
                  filteredSecurityLogs.map((log) => {
                    const isLogin = log.action.toLowerCase().includes('inicio');
                    const isLogout = log.action.toLowerCase().includes('cierre');
                    const isPassword = log.action.toLowerCase().includes('contraseña');
                    const isDelete = log.action.toLowerCase().includes('eliminación') || log.action.toLowerCase().includes('suspens');

                    const actionBadgeClass = isLogin
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                      : isLogout
                      ? 'bg-zinc-800 text-zinc-400 border-white/[0.06]'
                      : isPassword
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      : isDelete
                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                      : 'bg-purple-500/10 text-purple-300 border-purple-500/20';

                    const isMobileDevice =
                      log.deviceType === 'mobile' ||
                      log.deviceType === 'tablet' ||
                      (log.deviceName && /phone|móvil|galaxy|pixel|redmi|iphone|android|tablet|ipad/i.test(log.deviceName));

                    return (
                      <div
                        key={log.id}
                        className="p-4 rounded-xl bg-zinc-950/60 border border-white/[0.06] hover:border-white/[0.12] transition-colors flex flex-col gap-2.5 text-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border ${actionBadgeClass}`}>
                              {log.action}
                            </span>
                            <span className="font-semibold text-white">
                              {log.adminName}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-500 shrink-0 font-mono">
                            {new Date(log.timestamp).toLocaleString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>

                        <p className="text-zinc-400 text-xs leading-relaxed">
                          {log.details}
                        </p>

                        {/* Connection & Hardware Badges */}
                        {(log.ip || log.deviceName) && (
                          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-white/[0.04]">
                            {log.ip && (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-500/20 font-mono"
                                title={`IP: ${log.ip}${log.city ? ` · ${log.city}` : ''}`}
                              >
                                <Globe className="w-3 h-3 text-indigo-400 shrink-0" />
                                <span>{log.ip}</span>
                                {log.city && (
                                  <span className="text-zinc-400 font-sans">
                                    · {log.city}{log.country ? `, ${log.country}` : ''}
                                  </span>
                                )}
                              </span>
                            )}

                            {log.deviceName && (
                              <span
                                className="inline-flex items-center gap-1.5 text-[11px] text-zinc-300 bg-zinc-900/90 px-2 py-0.5 rounded-md border border-white/[0.08]"
                                title={`${log.deviceName} (${log.os || ''} · ${log.browser || ''})`}
                              >
                                {isMobileDevice ? (
                                  <Smartphone className="w-3 h-3 text-sky-400 shrink-0" />
                                ) : (
                                  <Laptop className="w-3 h-3 text-zinc-400 shrink-0" />
                                )}
                                <span>{log.deviceName}</span>
                                {log.os && <span className="text-zinc-400 font-sans">· {log.os}</span>}
                                {log.browser && <span className="text-zinc-500 font-sans">({log.browser})</span>}
                              </span>
                            )}

                            {/* Device Category Tag */}
                            <span className="text-[10px] text-zinc-500 bg-zinc-900/50 px-1.5 py-0.5 rounded border border-white/[0.03]">
                              {isMobileDevice ? 'Dispositivo Móvil' : 'Estación de Trabajo'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
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
