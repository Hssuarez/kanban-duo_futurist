'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Challenge, ChallengeMember } from '@/lib/challengeTypes';
import { User } from '@/lib/types';
import { X, Users, UserPlus, UserMinus, ShieldCheck, Search } from 'lucide-react';

interface ChallengeMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge;
  members: ChallengeMember[];
  users: User[];
  currentUser: User;
  onAddMember: (userId: string) => void;
  onRemoveMember: (userId: string) => void;
}

export const ChallengeMembersModal: React.FC<ChallengeMembersModalProps> = ({
  isOpen,
  onClose,
  challenge,
  members,
  users,
  currentUser,
  onAddMember,
  onRemoveMember,
}) => {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Compañeros disponibles que no estén ya activos o invitados
  const availableUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.id !== currentUser.id &&
        u.isActive !== false &&
        !members.some((m) => m.userId === u.id && m.status !== 'declined')
    );
  }, [users, members, currentUser.id]);

  // Filtrado solo cuando se digita una búsqueda
  const searchedUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return availableUsers.filter((u) => {
      const matchName = u.name ? u.name.toLowerCase().includes(q) : false;
      const matchEmail = u.email ? u.email.toLowerCase().includes(q) : false;
      return matchName || matchEmail;
    });
  }, [availableUsers, searchQuery]);

  if (!isOpen || !mounted) return null;

  const isOwner = challenge.createdBy === currentUser.id;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-[#070c18] border border-cyan-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-white text-sm sm:text-base">
                Participantes del Reto
              </h3>
              <p className="text-[11px] text-zinc-400 truncate max-w-[240px]">
                {challenge.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Members List */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* 1. Miembros Activos */}
          <div>
            <h4 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Miembros Activos</span>
              <span className="text-[11px] text-cyan-400 font-bold">
                {members.filter((m) => !m.status || m.status === 'accepted').length}
              </span>
            </h4>

            <div className="space-y-2">
              {members
                .filter((m) => !m.status || m.status === 'accepted')
                .map((member) => {
                  const user = users.find((u) => u.id === member.userId) || {
                    id: member.userId,
                    name: 'Usuario',
                    username: 'user',
                    role: 'user',
                    avatar: '',
                  };
                  const isCreator = challenge.createdBy === member.userId;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-zinc-950/60 border border-white/[0.04]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/[0.08] overflow-hidden flex items-center justify-center text-xs font-bold text-zinc-300">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user.name.slice(0, 1)
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-medium text-white truncate block">
                            {user.name}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {isCreator ? '👑 Creador' : 'Participante Activo'} · Unido:{' '}
                            {member.joinedAt?.slice(5) || '10-01'}
                          </span>
                        </div>
                      </div>

                      {/* Remove Button (only if owner and not removing creator) */}
                      {isOwner && !isCreator && (
                        <button
                          type="button"
                          onClick={() => onRemoveMember(member.userId)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                          title="Quitar participante"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* 2. Invitaciones Pendientes de Aceptación */}
          {members.some((m) => m.status === 'pending') && (
            <div className="pt-2 border-t border-white/[0.06]">
              <h4 className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Invitaciones Pendientes</span>
                <span className="text-[11px] font-bold">
                  {members.filter((m) => m.status === 'pending').length}
                </span>
              </h4>

              <div className="space-y-2">
                {members
                  .filter((m) => m.status === 'pending')
                  .map((member) => {
                    const user = users.find((u) => u.id === member.userId) || {
                      id: member.userId,
                      name: 'Usuario',
                      username: 'user',
                      role: 'user',
                      avatar: '',
                    };

                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/20"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-amber-500/30 overflow-hidden flex items-center justify-center text-xs font-bold text-amber-300">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              user.name.slice(0, 1)
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-medium text-white truncate block">
                              {user.name}
                            </span>
                            <span className="text-[10px] font-mono text-amber-400/90 flex items-center gap-1">
                              ⏳ Esperando aceptación
                            </span>
                          </div>
                        </div>

                        {/* Cancel invitation */}
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => onRemoveMember(member.userId)}
                            className="px-2 py-1 text-[11px] font-mono text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                            title="Cancelar invitación"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 3. Invitar Compañeros con Buscador */}
          {isOwner && (
            <div className="pt-2 border-t border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Invitar Compañeros</span>
                </h4>
              </div>

              {/* Buscador de compañeros por nombre o correo */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre o correo para invitar..."
                  className="w-full bg-zinc-900/90 border border-white/[0.08] focus:border-cyan-400 text-white rounded-xl pl-8 pr-8 py-2 text-xs focus:outline-none transition-colors font-mono placeholder:text-zinc-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Resultados SOLO cuando se digita una búsqueda */}
              {searchQuery.trim().length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar pr-0.5 animate-fade-in">
                  {searchedUsers.length === 0 ? (
                    <div className="text-center py-3 text-xs font-mono text-zinc-500 bg-zinc-900/30 rounded-xl border border-white/[0.04]">
                      No se encontraron compañeros con "{searchQuery}"
                    </div>
                  ) : (
                    searchedUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-white/[0.04] transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/[0.08] overflow-hidden flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              u.name.slice(0, 1).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 flex flex-col">
                            <span className="text-xs text-zinc-200 truncate font-medium">{u.name}</span>
                            {u.email && (
                              <span className="text-[10px] font-mono text-zinc-500 truncate">
                                {u.email}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onAddMember(u.id);
                            setSearchQuery('');
                          }}
                          className="px-2.5 py-1 text-xs font-mono text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Invitar</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-300 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
