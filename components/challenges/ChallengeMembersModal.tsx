'use client';

import React from 'react';
import { Challenge, ChallengeMember } from '@/lib/challengeTypes';
import { User } from '@/lib/types';
import { X, Users, UserPlus, UserMinus, ShieldCheck } from 'lucide-react';

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
  if (!isOpen) return null;

  const isOwner = challenge.createdBy === currentUser.id;

  return (
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
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto custom-scrollbar flex-1">
          <h4 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
            Miembros Actuales ({members.length})
          </h4>

          <div className="space-y-2">
            {members.map((member) => {
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
                        {isCreator ? '👑 Creador' : 'Participante'} · Unido:{' '}
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

          {/* Add Available Users */}
          {isOwner && (
            <div className="pt-3 border-t border-white/[0.06] space-y-2">
              <h4 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                Invitar Compañeros
              </h4>

              <div className="space-y-1.5">
                {users
                  .filter((u) => !members.some((m) => m.userId === u.id))
                  .map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-zinc-900/40 hover:bg-zinc-900 border border-white/[0.04] transition-all"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                          {u.name.slice(0, 1)}
                        </div>
                        <span className="text-xs text-zinc-200 truncate">{u.name}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onAddMember(u.id)}
                        className="px-2.5 py-1 text-xs font-mono text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Invitar</span>
                      </button>
                    </div>
                  ))}
              </div>
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
    </div>
  );
};
