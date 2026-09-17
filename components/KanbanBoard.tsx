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
  AppView,
  Project,
  Subtask,
  TaskComment,
  TaskAttachment,
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
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getActiveProjectId,
  setActiveProjectId,
  DEFAULT_PROJECTS,
  auditSessionIfChanged,
} from '@/lib/storage';
import { LoginForm } from './auth/LoginForm';
import { Navbar } from './Navbar';
import { PeerActivityBar } from './PeerActivityBar';
import { Column } from './Column';
import { TaskModal } from './TaskModal';
import { UserProfileModal } from './UserProfileModal';
import { AdminPanel } from './admin/AdminPanel';
import { TaskCalendar } from './calendar/TaskCalendar';
import { TaskDashboard } from './dashboard/TaskDashboard';
import { ProjectModal } from './project/ProjectModal';
import { ProjectReportModal } from './project/ProjectReportModal';
import { AmbientNetworkBackground } from './ui/AmbientNetworkBackground';
import { CommandPalette } from './command/CommandPalette';
import { NotificationToasts } from './notifications/NotificationToasts';
import { addNotification, evaluateDailyBriefing } from '@/lib/notifications';
import { initPresence } from '@/lib/presence';
import { startPomodoro } from '@/lib/pomodoro';
import { Filter, Tag as TagIcon, X, FileBarChart } from 'lucide-react';

export const KanbanBoard: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('board');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string>('proj-default');

  // UI state
  const [spaceFilter, setSpaceFilter] = useState<SpaceFilter>('mine');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [targetColumnStatus, setTargetColumnStatus] = useState<TaskStatus>('iniciado');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isProjectReportOpen, setIsProjectReportOpen] = useState(false);

  // Load and refresh data
  const refreshData = useCallback(() => {
    const loadedUsers = getUsers();
    const loadedSession = getSessionUser();
    const loadedTasks = getTasks();
    const loadedLogs = getActivityLogs();
    const loadedProjects = getProjects();
    const loadedActiveProjId = getActiveProjectId();

    setUsers(loadedUsers);
    setSessionUser(loadedSession);
    setTasks(loadedTasks);
    setLogs(loadedLogs);
    setProjects(loadedProjects);
    setActiveProjectIdState(loadedActiveProjId);
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

  // Global keyboard shortcut: Ctrl+K / Cmd+K opens Command Palette
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs/textareas unless Ctrl+K is explicitly pressed
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Sincronización de presencia en tiempo real y auditoría de sesión/dispositivo
  useEffect(() => {
    if (sessionUser) {
      initPresence(sessionUser);
      auditSessionIfChanged(sessionUser);
    } else {
      initPresence(null);
    }
  }, [sessionUser]);

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

  // Filtro de proyectos accesibles para el usuario conectado
  // (Admin ve todos, creador ve el suyo, miembros con acceso ven el compartido)
  const accessibleProjects = useMemo(() => {
    if (!sessionUser) return [];
    return projects.filter(
      (p) =>
        sessionUser.role === 'admin' ||
        p.createdBy === sessionUser.id ||
        (Array.isArray(p.memberIds) && p.memberIds.includes(sessionUser.id))
    );
  }, [projects, sessionUser]);

  // Proyecto activo actual con múltiples capas de respaldo
  const activeProject = useMemo(() => {
    const found = accessibleProjects.find((p) => p.id === activeProjectId);
    return found || accessibleProjects[0] || projects[0] || DEFAULT_PROJECTS[0];
  }, [accessibleProjects, activeProjectId, projects]);

  // Tareas pertenecientes al proyecto activo
  const projectTasks = useMemo(() => {
    const projId = activeProject?.id || 'proj-default';
    return tasks.filter((t) => (t.projectId || 'proj-default') === projId);
  }, [tasks, activeProject?.id]);

  // Miembros del proyecto activo (estrictamente filtrados por pertenencia al proyecto)
  const projectMembers = useMemo(() => {
    if (!activeProject) return users;
    const memberIdSet = new Set<string>(
      Array.isArray(activeProject.memberIds) ? activeProject.memberIds : []
    );
    if (activeProject.createdBy) {
      memberIdSet.add(activeProject.createdBy);
    }
    // Incluir usuarios que tienen tareas asignadas en este proyecto para no romper filtros
    projectTasks.forEach((t) => {
      if (t.assignedTo) memberIdSet.add(t.assignedTo);
    });

    const list = users.filter((u) => memberIdSet.has(u.id) && u.isActive !== false);
    if (list.length > 0) return list;
    return sessionUser ? [sessionUser] : users;
  }, [users, activeProject, projectTasks, sessionUser]);

  // Peer dentro del proyecto activo
  const peerUser = useMemo(() => {
    return (
      projectMembers.find((u) => u.id !== sessionUser?.id) ||
      users.find((u) => u.id !== sessionUser?.id) ||
      users[0]
    );
  }, [projectMembers, users, sessionUser]);

  // Evaluar Daily Briefing inteligente al iniciar o cambiar de proyecto
  useEffect(() => {
    if (sessionUser && activeProject && projectTasks.length > 0) {
      evaluateDailyBriefing(projectTasks, sessionUser, activeProject.id);
    }
  }, [sessionUser, activeProject, projectTasks]);

  // Control de selección y gestión de proyectos
  const handleSelectProject = (projId: string) => {
    setActiveProjectId(projId);
    setActiveProjectIdState(projId);
    // Si estábamos filtrando por un compañero específico, volver a 'all'
    if (spaceFilter !== 'mine' && spaceFilter !== 'all') {
      setSpaceFilter('all');
    }
  };

  const handleOpenCreateProject = () => {
    setEditingProject(null);
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (proj: Project) => {
    setEditingProject(proj);
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async (data: {
    name: string;
    description?: string;
    color: string;
    memberIds: string[];
  }) => {
    if (!sessionUser) return;
    if (editingProject) {
      await updateProject(editingProject.id, data, sessionUser);
    } else {
      const created = await createProject(data, sessionUser);
      handleSelectProject(created.id);
    }
    refreshData();
  };

  const handleDeleteProject = async (projId: string) => {
    if (!sessionUser) return;
    await deleteProject(projId, sessionUser);
    refreshData();
  };

  // Iniciar sesión de enfoque Pomodoro (25m)
  const handleStartFocus = (task: Task) => {
    startPomodoro(task.id, task.title, 25);
  };

  // Manejo de tareas
  const handleSaveTask = async (taskData: {
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    assignedTo: string;
    dueDate?: string;
    projectId?: string;
    subtasks?: Subtask[];
    tags?: string[];
    comments?: TaskComment[];
    attachments?: TaskAttachment[];
  }) => {
    if (!sessionUser) return;

    try {
      const targetProjectId =
        taskData.projectId ||
        activeProject?.id ||
        getActiveProjectId() ||
        'proj-default';

      if (editingTask) {
        await updateTask(
          editingTask.id,
          {
            ...taskData,
            projectId: targetProjectId,
          },
          sessionUser
        );
        if (taskData.status === 'finalizado' && editingTask.status !== 'finalizado') {
          confetti({
            particleCount: 35,
            spread: 55,
            origin: { y: 0.7 },
            colors: ['#10b981', '#3b82f6', '#f59e0b'],
          });
          // Notification: task completed
          addNotification({
            type: 'task_completed',
            title: 'Tarea finalizada',
            message: `${sessionUser.name} completó "${editingTask.title}"`,
            taskId: editingTask.id,
            taskTitle: editingTask.title,
            projectId: targetProjectId,
            userId: 'all',
            actorName: sessionUser.name,
            actorAvatar: sessionUser.avatar,
          });
        }
        // Notification: task reassigned
        if (taskData.assignedTo && taskData.assignedTo !== editingTask.assignedTo && taskData.assignedTo !== sessionUser.id) {
          addNotification({
            type: 'task_assigned',
            title: 'Tarea reasignada',
            message: `${sessionUser.name} te asignó "${editingTask.title}"`,
            taskId: editingTask.id,
            taskTitle: editingTask.title,
            projectId: targetProjectId,
            userId: taskData.assignedTo,
            actorName: sessionUser.name,
            actorAvatar: sessionUser.avatar,
          });
        }
      } else {
        const created = await createTask(
          {
            ...taskData,
            projectId: targetProjectId,
            createdBy: sessionUser.id,
          },
          sessionUser
        );
        // Notification: new task created
        addNotification({
          type: 'task_created',
          title: 'Nueva tarea creada',
          message: `"${taskData.title}" en ${activeProject?.name || 'el proyecto'}`,
          taskId: created.id,
          taskTitle: taskData.title,
          projectId: targetProjectId,
          userId: 'all',
          actorName: sessionUser.name,
          actorAvatar: sessionUser.avatar,
        });
        // Notification: task assigned to peer
        if (taskData.assignedTo && taskData.assignedTo !== sessionUser.id) {
          addNotification({
            type: 'task_assigned',
            title: 'Nueva tarea asignada',
            message: `${sessionUser.name} te asignó "${taskData.title}"`,
            taskId: created.id,
            taskTitle: taskData.title,
            projectId: targetProjectId,
            userId: taskData.assignedTo,
            actorName: sessionUser.name,
            actorAvatar: sessionUser.avatar,
          });
        }
      }

      // Si la tarea creada/editada no está asignada al usuario actual y estaba en 'mine',
      // cambiar automáticamente el filtro a 'all' para que el usuario VEA INMEDIATAMENTE
      // la tarea que acaba de guardar y no piense que "desapareció o se estalló"
      if (taskData.assignedTo !== sessionUser.id && spaceFilter === 'mine') {
        setSpaceFilter('all');
      }

      refreshData();
    } catch (err) {
      console.error('Error al procesar tarea en tablero:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!sessionUser) return;
    await deleteTask(taskId, sessionUser);
    refreshData();
  };

  const handleMoveStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (!sessionUser) return;
    const task = tasks.find((t) => t.id === taskId);
    await updateTask(taskId, { status: newStatus }, sessionUser);

    if (newStatus === 'finalizado') {
      confetti({
        particleCount: 35,
        spread: 55,
        origin: { y: 0.7 },
        colors: ['#10b981', '#3b82f6', '#f59e0b'],
      });
      if (task) {
        addNotification({
          type: 'task_completed',
          title: 'Tarea finalizada',
          message: `${sessionUser.name} completó "${task.title}"`,
          taskId: task.id,
          taskTitle: task.title,
          projectId: task.projectId || activeProject?.id || 'proj-default',
          userId: 'all',
          actorName: sessionUser.name,
          actorAvatar: sessionUser.avatar,
        });
      }
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

  
  const handleUpdateTaskDueDate = async (taskId: string, newDueDate: string) => {
    if (!sessionUser) return;
    await updateTask(taskId, { dueDate: newDueDate }, sessionUser);
    refreshData();
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setTargetColumnStatus(task.status);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditById = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      handleOpenEdit(task);
    }
  };

  // Filtrado de tareas dentro del proyecto activo
  // Tareas filtradas por espacio de trabajo (Mis tareas / Duvan / Todo el equipo)
  const spaceFilteredTasks = useMemo(() => {
    if (!sessionUser) return [];
    return projectTasks.filter((task) => {
      if (spaceFilter === 'mine' && task.assignedTo !== sessionUser.id) {
        return false;
      } else if (spaceFilter !== 'mine' && spaceFilter !== 'all') {
        const targetUserId = spaceFilter === 'peer' ? peerUser?.id : spaceFilter;
        if (task.assignedTo !== targetUserId) {
          return false;
        }
      }
      return true;
    });
  }, [projectTasks, spaceFilter, sessionUser, peerUser]);

  // Filtrado de tareas dentro del proyecto activo para el tablero Kanban (espacio + búsqueda + prioridad)
  const filteredTasks = useMemo(() => {
    if (!sessionUser) return [];

    return spaceFilteredTasks.filter((task) => {
      // 1. Búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // 2. Prioridad
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      // 3. Etiqueta / Tag
      if (selectedTagFilter) {
        if (!task.tags || !task.tags.includes(selectedTagFilter)) {
          return false;
        }
      }

      return true;
    });
  }, [spaceFilteredTasks, sessionUser, searchQuery, priorityFilter, selectedTagFilter]);

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
      <div className="min-h-screen flex items-center justify-center bg-[#09090b] font-sans">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-200 rounded-full animate-spin"></div>
          <span className="text-xs font-medium text-zinc-400">Cargando espacio de trabajo...</span>
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
    <div className="min-h-screen flex flex-col bg-[#09090b] selection:bg-cyan-900/40 selection:text-cyan-100 pb-12 font-sans relative overflow-x-hidden">
      {/* Ambient Network Background (quiet, faint digital universe for the workspace) */}
      <AmbientNetworkBackground variant={currentView} className="fixed inset-0 z-0 pointer-events-none" />

      {/* Top Navbar: Nivel 3 en la jerarquía de apilamiento (z-40) */}
      <div className="sticky top-0 z-40">
        <Navbar
          currentUser={sessionUser}
          users={users}
          projects={accessibleProjects}
          activeProject={activeProject}
          onSelectProject={handleSelectProject}
          onOpenCreateProject={handleOpenCreateProject}
          onOpenEditProject={handleOpenEditProject}
          currentView={currentView}
          setCurrentView={setCurrentView}
          spaceFilter={spaceFilter}
          setSpaceFilter={setSpaceFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenNewTaskModal={() => handleOpenAddNew('iniciado')}
          onOpenAdminPanel={() => setCurrentView('admin')}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onLogout={handleLogout}
          tasks={projectTasks}
          onOpenTaskDetail={handleOpenEditById}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenProjectReport={() => setIsProjectReportOpen(true)}
        />
      </div>

      {/* Main Container */}
      <main className={`${currentView === 'calendar' ? 'max-w-[1680px]' : 'max-w-7xl'} w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex-1 flex flex-col relative z-10`}>
        {currentView === 'board' && (
          <div className="animate-view-fade flex-1 flex flex-col">
            {/* Peer Activity Bar enfocada en miembros y tareas del proyecto activo */}
            <PeerActivityBar
              currentUser={sessionUser}
              users={projectMembers}
              tasks={projectTasks}
              logs={logs}
            />

            {/* Board Controls & Subheader */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                {/* Project Badge with max-width and truncate on mobile */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-white/[0.08] bg-zinc-900/80 text-xs font-medium max-w-[200px] sm:max-w-xs truncate shrink-0 text-zinc-200"
                  title={activeProject.name}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: activeProject.color || '#3b82f6' }}
                  />
                  <span className="truncate">{activeProject.name}</span>
                </div>

                {/* Active Tag Filter Pill */}
                {selectedTagFilter && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono shrink-0 animate-fade-in">
                    <TagIcon className="w-3 h-3 text-cyan-400" />
                    <span>{selectedTagFilter}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTagFilter(null)}
                      className="ml-1 hover:text-white cursor-pointer"
                      title="Quitar filtro de etiqueta"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Project Report Button */}
                <button
                  type="button"
                  onClick={() => setIsProjectReportOpen(true)}
                  className="px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-white/[0.08] hover:border-cyan-500/30 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  title="Generar y Exportar Reporte de Proyecto"
                >
                  <FileBarChart className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Reporte</span>
                </button>

                <h2 className="text-xs sm:text-sm font-medium text-zinc-300 flex items-center gap-1.5 truncate">
                  <span className="truncate">
                    {spaceFilter === 'mine' && (
                      <>
                        <span className="sm:hidden">Mis tareas: {sessionUser.name.split(' ')[0]}</span>
                        <span className="hidden sm:inline">Mis tareas ({sessionUser.name})</span>
                      </>
                    )}
                    {spaceFilter !== 'mine' && spaceFilter !== 'all' && (() => {
                      const activeFilterUser = users.find((u) => u.id === spaceFilter) || peerUser;
                      return (
                        <>
                          <span className="sm:hidden">Tareas: {activeFilterUser?.name?.split(' ')[0] || 'Compañero'}</span>
                          <span className="hidden sm:inline">Tareas de {activeFilterUser?.name || 'Compañero'}</span>
                        </>
                      );
                    })()}
                    {spaceFilter === 'all' && 'Tablero del equipo'}
                  </span>
                </h2>

                <span className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-medium font-mono shrink-0">
                  {filteredTasks.length} tareas
                </span>
              </div>

              {/* Priority filter selector */}
              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-1 sm:pt-0">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                  <Filter className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Prioridad:</span>
                </div>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-500 font-sans cursor-pointer"
                >
                  <option value="all">Todas</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
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
                onSelectTag={setSelectedTagFilter}
                onStartFocus={handleStartFocus}
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
                onSelectTag={setSelectedTagFilter}
                onStartFocus={handleStartFocus}
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
                onSelectTag={setSelectedTagFilter}
                onStartFocus={handleStartFocus}
              />
            </div>
          </div>
        )}

        {currentView === 'calendar' && (
          <div className="animate-view-fade flex-1 flex flex-col pb-6">
            <TaskCalendar
              tasks={projectTasks}
              users={projectMembers}
              currentUser={sessionUser}
              onOpenNewTask={() => handleOpenAddNew('iniciado')}
              onOpenEditTask={handleOpenEdit}
              onUpdateTaskDueDate={handleUpdateTaskDueDate}
            />
          </div>
        )}

        {currentView === 'dashboard' && (
          <div className="animate-view-fade">
            <TaskDashboard
              tasks={projectTasks}
              users={projectMembers}
              currentUser={sessionUser}
              onOpenTaskDetail={handleOpenEdit}
            />
          </div>
        )}
      </main>

      {/* Task Creation/Editing Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        editingTask={editingTask}
        defaultStatus={targetColumnStatus}
        users={projectMembers}
        currentUser={sessionUser}
        activeProject={activeProject}
      />

      {/* User Self-Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={sessionUser}
        onUpdateProfile={handleUpdateSelfProfile}
      />

      {/* Project Management Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        currentUser={sessionUser}
        users={users}
        editingProject={editingProject}
        onSaveProject={handleSaveProject}
        onDeleteProject={handleDeleteProject}
      />

      {/* Project Executive Report Modal */}
      <ProjectReportModal
        isOpen={isProjectReportOpen}
        onClose={() => setIsProjectReportOpen(false)}
        project={activeProject}
        tasks={projectTasks}
        users={users}
      />

      {/* Global Command Palette HUD (Ctrl+K / Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tasks={projectTasks}
        projects={accessibleProjects}
        activeProject={activeProject}
        onSelectProject={handleSelectProject}
        onChangeView={setCurrentView}
        onOpenNewTask={() => handleOpenAddNew('iniciado')}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onSelectTask={handleOpenEdit}
      />

      {/* Real-time Floating HUD Toasts */}
      <NotificationToasts
        currentUser={sessionUser}
        activeProject={activeProject}
        onOpenTaskDetail={handleOpenEditById}
      />
    </div>
  );
};
