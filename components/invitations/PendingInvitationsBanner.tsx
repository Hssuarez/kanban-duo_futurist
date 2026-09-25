'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Project } from '@/lib/types';
import { Challenge, ChallengeMember } from '@/lib/challengeTypes';
import {
  getProjects,
  acceptProjectInvitation,
  declineProjectInvitation,
  subscribeToSync,
  getUsers,
} from '@/lib/storage';
import {
  getLocalChallenges,
  getLocalChallengeMembers,
  acceptChallengeInvitation,
  declineChallengeInvitation,
} from '@/lib/challengeStorage';
import { playSuccessSound, playChimeSound } from '@/lib/soundEffects';
import { FolderKanban, Trophy, Check, X, BellRing, Sparkles } from 'lucide-react';

interface PendingInvitationsBannerProps {
  currentUser: User;
  onRefreshData?: () => void;
  onSelectProject?: (projectId: string) => void;
}

export const PendingInvitationsBanner: React.FC<PendingInvitationsBannerProps> = ({
  currentUser,
  onRefreshData,
  onSelectProject,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengeMembers, setChallengeMembers] = useState<ChallengeMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const loadData = useCallback(() => {
    if (typeof window === 'undefined') return;
    setProjects(getProjects());
    setChallenges(getLocalChallenges());
    setChallengeMembers(getLocalChallengeMembers());
    setAllUsers(getUsers());
  }, []);

  useEffect(() => {
    loadData();
    const unsub = subscribeToSync((type) => {
      if (type === 'projects' || type === 'challenges' || type === 'notifications') {
        loadData();
      }
    });
    return () => unsub();
  }, [loadData]);

  // Proyectos donde el usuario tiene invitación pendiente
  const pendingProjects = useMemo(() => {
    if (!currentUser) return [];
    return projects.filter(
      (p) => Array.isArray(p.pendingMemberIds) && p.pendingMemberIds.includes(currentUser.id)
    );
  }, [projects, currentUser]);

  // Retos donde el usuario tiene invitación pendiente
  const pendingChallenges = useMemo(() => {
    if (!currentUser) return [];
    return challengeMembers
      .filter((m) => m.userId === currentUser.id && m.status === 'pending')
      .map((m) => {
        const ch = challenges.find((c) => c.id === m.challengeId);
        return {
          member: m,
          challenge: ch,
        };
      })
      .filter((item): item is { member: ChallengeMember; challenge: Challenge } => Boolean(item.challenge));
  }, [challengeMembers, challenges, currentUser]);

  const totalPending = pendingProjects.length + pendingChallenges.length;

  if (totalPending === 0) return null;

  // Handlers para proyectos
  const handleAcceptProject = async (projectId: string) => {
    setIsProcessing(`proj-${projectId}`);
    try {
      playSuccessSound();
      await acceptProjectInvitation(projectId, currentUser);
      loadData();
      if (onSelectProject) {
        onSelectProject(projectId);
      }
      if (onRefreshData) {
        onRefreshData();
      }
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeclineProject = async (projectId: string) => {
    setIsProcessing(`proj-${projectId}`);
    try {
      playChimeSound();
      await declineProjectInvitation(projectId, currentUser);
      loadData();
      if (onRefreshData) {
        onRefreshData();
      }
    } finally {
      setIsProcessing(null);
    }
  };

  // Handlers para retos
  const handleAcceptChallenge = async (challengeId: string) => {
    setIsProcessing(`ch-${challengeId}`);
    try {
      playSuccessSound();
      await acceptChallengeInvitation(challengeId, currentUser.id);
      loadData();
      if (onRefreshData) {
        onRefreshData();
      }
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeclineChallenge = async (challengeId: string) => {
    setIsProcessing(`ch-${challengeId}`);
    try {
      playChimeSound();
      await declineChallengeInvitation(challengeId, currentUser.id);
      loadData();
      if (onRefreshData) {
        onRefreshData();
      }
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 mb-1 animate-fade-in font-sans">
      <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-[#0a0f1d]/90 to-amber-950/30 p-3.5 backdrop-blur-md shadow-[0_0_30px_rgba(245,158,11,0.15)] space-y-3">
        {/* Header del Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            </span>
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                Invitaciones Pendientes ({totalPending})
              </h3>
            </div>
          </div>
          <span className="text-[11px] font-mono text-amber-400/80">
            Acepta para sincronizar tu acceso y colaborar en tiempo real
          </span>
        </div>

        {/* Lista de invitaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {/* Proyectos */}
          {pendingProjects.map((project) => {
            const creator = allUsers.find((u) => u.id === project.createdBy);
            const isBusy = isProcessing === `proj-${project.id}`;

            return (
              <div
                key={project.id}
                className="flex items-center justify-between p-3 rounded-lg bg-black/60 border border-cyan-500/25 hover:border-cyan-500/40 transition-all gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: `${project.color || '#06b6d4'}20`,
                      borderColor: `${project.color || '#06b6d4'}50`,
                    }}
                  >
                    <FolderKanban className="w-4 h-4" style={{ color: project.color || '#06b6d4' }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold font-mono text-zinc-100 truncate">
                        {project.name}
                      </span>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
                        Proyecto
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-zinc-400 truncate">
                      Invitado por <span className="text-cyan-300 font-semibold">{creator?.name || 'Compañero'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleAcceptProject(project.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-mono font-bold tracking-wider transition-all cursor-pointer active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.35)] flex items-center gap-1 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Aceptar</span>
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleDeclineProject(project.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 text-xs font-mono transition-all cursor-pointer active:scale-95 flex items-center gap-1 disabled:opacity-50"
                    title="Rechazar invitación"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Rechazar</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Retos */}
          {pendingChallenges.map(({ challenge }) => {
            const creator = allUsers.find((u) => u.id === challenge.createdBy);
            const isBusy = isProcessing === `ch-${challenge.id}`;

            return (
              <div
                key={challenge.id}
                className="flex items-center justify-between p-3 rounded-lg bg-black/60 border border-amber-500/25 hover:border-amber-500/40 transition-all gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-950/40 border border-amber-500/30 text-lg">
                    {challenge.icon || '🏆'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold font-mono text-zinc-100 truncate">
                        {challenge.title}
                      </span>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-950/70 border border-amber-500/30 text-amber-300">
                        Reto
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-zinc-400 truncate">
                      Invitado por <span className="text-amber-300 font-semibold">{creator?.name || 'Compañero'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleAcceptChallenge(challenge.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-mono font-bold tracking-wider transition-all cursor-pointer active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.35)] flex items-center gap-1 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Aceptar</span>
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleDeclineChallenge(challenge.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 text-xs font-mono transition-all cursor-pointer active:scale-95 flex items-center gap-1 disabled:opacity-50"
                    title="Rechazar invitación"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Rechazar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
