'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Task,
  User,
  ActivityLog,
  TaskStatus,
  TaskPriority,
  SpaceFilter,
} from '@/lib/types';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getUsers,
  getSessionUser,
  logout as logoutStorage,
  updateSelfProfile,
  getActivityLogs,
  subscribeToSync,
  initializeDefaultUsers,
} from '@/lib/storage';
import { LoginForm } from './auth/LoginForm';
import { Navbar } from './Navbar';
import { PeerActivityBar } from './PeerActivityBar';
import { Column } from './Column';
import { TaskModal } from './TaskModal';
import { UserProfileModal } from './UserProfileModal';
import { AdminPanel } from './admin/AdminPanel';
import { Filter } from 'lucide-react';

export const KanbanBoard: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'board' | 'admin'>('board');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // UI state
  const [spaceFilter, setSpaceFilter] = useState<SpaceFilter>('mine');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [targetColumnStatus, setTargetColumnStatus] = useState<TaskStatus>('iniciado');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Load and refresh data
  const refreshData = useCallback(() => {
    const loadedUsers = getUsers();
    const loadedSession = getSessionUser();
    const loadedTasks = getTasks();
    const loadedLogs = getActivityLogs();

    setUsers(loadedUsers);
    setSessionUser(loadedSession);
    setTasks(loadedTasks);
    setLogs(loadedLogs);
  }, []);

  useEffect(() => {
    initializeDefaultUsers().then(() => {
      refreshData();
      setMounted(true);
    });

    const unsubscribe = subscribeToSync((_type) => {
      refreshData();
    });

    return () => unsubscribe();
  }, [refreshData]);

  // Manejo de sesión
  const handleLoginSuccess = (user: User) => {
    setSessionUser(user);
    refreshData();
  };

  const handleLogout = () => {
    logoutStorage();
    setSessionUser(null);
    setCurrentView('board');
  };

  // Actualización de perfil propio (nombre, foto, clave)
  const handleUpdateSelfProfile = async (updates: {
    name?: string;
    avatar?: string;
    newPasswordPlain?: string;
  }) => {
    if (!sessionUser) return false;
    const res = await updateSelfProfile(sessionUser.id, updates);
    if (res.success) {
      refreshData();
      return true;
    }
    return false;
  };

  // Manejo de tareas
  const handleSaveTask = async (taskData: {
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    assignedTo: string;
    dueDate?: string;
  }) => {
    if (!sessionUser) return;

    if (editingTask) {
      await updateTask(editingTask.id, taskData, sessionUser);
      if (taskData.status === 'finalizado' && editingTask.status !== 'finalizado') {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#ec4899', '#10b981', '#f59e0b'],
        });
      }
    } else {
      await createTask(
        {
          ...taskData,
          createdBy: sessionUser.id,
        },
        sessionUser
      );
    }
    refreshData();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!sessionUser) return;
    await deleteTask(taskId, sessionUser);
    refreshData();
  };

  const handleMoveStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (!sessionUser) return;
    await updateTask(taskId, { status: newStatus }, sessionUser);

    if (newStatus === 'finalizado') {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.7 },
        colors: ['#06b6d4', '#ec4899', '#10b981'],
      });
    }
    refreshData();
  };

  const handleDropTask = (taskId: string, newStatus: TaskStatus) => {
    if (!sessionUser) return;
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== newStatus) {
      handleMoveStatus(taskId, newStatus);
    }
  };

  const handleOpenAddNew = (status: TaskStatus = 'iniciado') => {
    setEditingTask(null);
    setTargetColumnStatus(status);
    setIsTaskModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setTargetColumnStatus(task.status);
    setIsTaskModalOpen(true);
  };

  // Filtrado de tareas
  const peerUser = users.find((u) => u.id !== sessionUser?.id) || users[0];

  const filteredTasks = useMemo(() => {
    if (!sessionUser) return [];

    return tasks.filter((task) => {
      // 1. Filtro por espacio
      if (spaceFilter === 'mine' && task.assignedTo !== sessionUser.id) {
        return false;
      }
      if (spaceFilter === 'peer' && task.assignedTo !== peerUser?.id) {
        return false;
      }

      // 2. Búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // 3. Prioridad
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, spaceFilter, sessionUser, peerUser, searchQuery, priorityFilter]);

  const iniciadoTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'iniciado'),
    [filteredTasks]
  );
  const trabajandoTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'trabajando'),
    [filteredTasks]
  );
  const finalizadoTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'finalizado'),
    [filteredTasks]
  );

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080a11] font-mono">
        <div className="flex flex-col items-center gap-3 text-cyan-400">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_#06b6d4]"></div>
          <span className="text-xs font-bold uppercase tracking-widest">// INICIALIZANDO PROTOCOLO CYBERPUNK...</span>
        </div>
      </div>
    );
  }

  // Si no hay sesión activa, mostrar pantalla de login segura
  if (!sessionUser) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  // Si el usuario seleccionó la vista de Panel de Administración (y es admin)
  if (currentView === 'admin' && sessionUser.role === 'admin') {
    return (
      <AdminPanel
        currentUser={sessionUser}
        users={users}
        onBackToBoard={() => setCurrentView('board')}
        onRefreshData={refreshData}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#080a11] selection:bg-cyan-500 selection:text-black pb-12 font-mono">
      {/* Top Navbar */}
      <Navbar
        currentUser={sessionUser}
        users={users}
        spaceFilter={spaceFilter}
        setSpaceFilter={setSpaceFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenNewTaskModal={() => handleOpenAddNew('iniciado')}
        onOpenAdminPanel={() => setCurrentView('admin')}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex-1 flex flex-col">
        {/* Peer Activity Bar */}
        <PeerActivityBar
          currentUser={sessionUser}
          users={users}
          tasks={tasks}
          logs={logs}
        />

        {/* Board Controls & Subheader */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>
                {spaceFilter === 'mine' && `// MI ESPACIO: ${sessionUser.name.toUpperCase()}`}
                {spaceFilter === 'peer' && `// ESPACIO PEER: ${peerUser?.name?.toUpperCase() || 'COMPAÑERO'}`}
                {spaceFilter === 'all' && '// REJILLA DE EQUIPO (GLOBAL)'}
              </span>
            </h2>
            <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
              {filteredTasks.length} TAREAS
            </span>
          </div>

          {/* Priority filter selector */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">PRIORIDAD:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs bg-[#101422] border border-slate-700 rounded-lg px-2.5 py-1.5 text-cyan-300 focus:outline-none focus:border-cyan-400 shadow-2xs font-mono"
            >
              <option value="all">TODAS</option>
              <option value="alta">ALTA</option>
              <option value="media">MEDIA</option>
              <option value="baja">BAJA</option>
            </select>
          </div>
        </div>

        {/* 3 Columns Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 flex-1 items-start">
          {/* Columna 1: Iniciado */}
          <Column
            status="iniciado"
            title="Iniciado"
            tasks={iniciadoTasks}
            users={users}
            currentUser={sessionUser}
            onAddNew={handleOpenAddNew}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteTask}
            onMoveStatus={handleMoveStatus}
            onDropTask={handleDropTask}
          />

          {/* Columna 2: Trabajando */}
          <Column
            status="trabajando"
            title="Trabajando"
            tasks={trabajandoTasks}
            users={users}
            currentUser={sessionUser}
            onAddNew={handleOpenAddNew}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteTask}
            onMoveStatus={handleMoveStatus}
            onDropTask={handleDropTask}
          />

          {/* Columna 3: Finalizado */}
          <Column
            status="finalizado"
            title="Finalizado"
            tasks={finalizadoTasks}
            users={users}
            currentUser={sessionUser}
            onAddNew={handleOpenAddNew}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteTask}
            onMoveStatus={handleMoveStatus}
            onDropTask={handleDropTask}
          />
        </div>
      </main>

      {/* Task Creation/Editing Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        editingTask={editingTask}
        defaultStatus={targetColumnStatus}
        users={users}
        currentUser={sessionUser}
      />

      {/* User Self-Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={sessionUser}
        onUpdateProfile={handleUpdateSelfProfile}
      />
    </div>
  );
};
