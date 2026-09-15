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

                      {/* Last Login */}
                      <td className="py-3.5 px-5 text-zinc-400 text-xs font-mono">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
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
          <div className="bg-zinc-900/40 border border-white/[0.08] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              Registro de eventos de seguridad
            </h3>
            <p className="text-xs text-zinc-400 mb-6">
              Historial de modificaciones de contraseñas, accesos y cambios de rol.
            </p>

            <div className="space-y-2.5">
              {securityLogs.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-4">No hay registros de auditoría aún.</p>
              ) : (
                securityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-zinc-300 bg-zinc-800 border border-white/[0.06] px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                          {log.action}
                        </span>
                        <span className="font-medium text-white">
                          {log.adminName}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-xs">
                        {log.details}
                      </p>
                    </div>
                    <span className="text-[11px] text-zinc-500 shrink-0 font-mono">
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
