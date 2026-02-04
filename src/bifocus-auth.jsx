import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, Plus, Clock, Zap, Battery, Moon, Sun, BarChart3, Target, Eye, Calendar, Edit2, Trash2, Circle, CheckCircle2, PlayCircle, LogOut } from 'lucide-react';
import { supabase } from './supabase';

const BiFocus = () => {
  // Auth states
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'

  // States principaux
  const [activeSpace, setActiveSpace] = useState('pro');
  const [activeView, setActiveView] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ focusTime: 0, tasksCompleted: 0, breaks: 0 });
  const [showAddTask, setShowAddTask] = useState(false);

  // Timer states
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerType, setTimerType] = useState('');
  const [timerPaused, setTimerPaused] = useState(false);
  const [timerInitialSeconds, setTimerInitialSeconds] = useState(0);
  const intervalRef = useRef(null);

  // Widget position
  const [widgetPos, setWidgetPos] = useState(() => {
    const saved = localStorage.getItem('timer-widget-pos');
    return saved ? JSON.parse(saved) : { x: window.innerWidth - 220, y: 100 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Check auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load data from Supabase
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, activeSpace]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('space', activeSpace);

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Load stats
      const { data: statsData, error: statsError } = await supabase
        .from('stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('space', activeSpace)
        .single();

      if (statsError && statsError.code !== 'PGRST116') throw statsError;
      
      if (statsData) {
        setStats({
          focusTime: statsData.focus_time || 0,
          tasksCompleted: statsData.tasks_completed || 0,
          breaks: statsData.breaks || 0
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Auth functions
  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      alert(error.message);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    const { error } = await supabase.auth.signUp({ email, password });
    
    if (error) {
      alert(error.message);
    } else {
      alert('Vérifiez votre email pour confirmer votre inscription !');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Timer logic
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (timerActive && !timerPaused) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerActive, timerPaused]);

  const startTimer = (minutes, type) => {
    setTimerSeconds(minutes * 60);
    setTimerInitialSeconds(minutes * 60);
    setTimerType(type);
    setTimerActive(true);
    setTimerPaused(false);
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const pauseTimer = () => setTimerPaused(true);
  const resumeTimer = () => setTimerPaused(false);

  const stopTimer = () => {
    setTimerActive(false);
    setTimerPaused(false);
    setTimerSeconds(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleTimerComplete = async () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Bifocus - Timer terminé !', {
        body: `${timerType} terminé`,
        icon: '/vite.svg'
      });
    }

    const minutesCompleted = Math.floor(timerInitialSeconds / 60);
    const newStats = { ...stats };
    
    if (timerType.includes('Repos')) {
      newStats.breaks = (newStats.breaks || 0) + 1;
    } else {
      newStats.focusTime = (newStats.focusTime || 0) + minutesCompleted;
    }

    setStats(newStats);
    await saveStats(newStats);
    stopTimer();
  };

  // Widget dragging
  const handleWidgetMouseDown = (e) => {
    if (e.target.closest('.widget-controls')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - widgetPos.x,
      y: e.clientY - widgetPos.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 200));
        const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 150));
        setWidgetPos({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        localStorage.setItem('timer-widget-pos', JSON.stringify(widgetPos));
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, widgetPos]);

  // Tasks CRUD
  const addTask = async (task) => {
    const newTask = {
      user_id: user.id,
      title: task.title,
      description: task.description,
      day: task.day,
      priority: task.priority || 'normal',
      estimated_minutes: task.estimatedMinutes || 30,
      status: 'todo',
      space: activeSpace
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert([newTask])
      .select()
      .single();

    if (error) {
      console.error('Error adding task:', error);
      alert('Erreur lors de l\'ajout de la tâche');
    } else {
      setTasks([...tasks, data]);
      setShowAddTask(false);
    }
  };

  const updateTask = async (id, updates) => {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating task:', error);
    } else {
      setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
      
      if (updates.status === 'done') {
        const newStats = { ...stats, tasksCompleted: (stats.tasksCompleted || 0) + 1 };
        setStats(newStats);
        await saveStats(newStats);
      }
    }
  };

  const deleteTask = async (id) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
    } else {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const saveStats = async (newStats) => {
    if (!user) return;

    const { data: existing } = await supabase
      .from('stats')
      .select('id')
      .eq('user_id', user.id)
      .eq('space', activeSpace)
      .single();

    const statsData = {
      user_id: user.id,
      space: activeSpace,
      focus_time: newStats.focusTime,
      tasks_completed: newStats.tasksCompleted,
      breaks: newStats.breaks,
      updated_at: new Date().toISOString()
    };

    if (existing) {
      await supabase
        .from('stats')
        .update(statsData)
        .eq('id', existing.id);
    } else {
      await supabase
        .from('stats')
        .insert([statsData]);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Auth screen
  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <div className="logo-auth">
            <Zap size={48} />
            <h1>bifocus</h1>
          </div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`auth-container ${darkMode ? 'dark' : 'light'}`}>
        <div className="auth-box">
          <div className="logo-auth">
            <Zap size={48} />
            <h1>bifocus</h1>
            <p>Votre cockpit de productivité</p>
          </div>

          <div className="auth-tabs">
            <button 
              type="button"
              className={authMode === 'login' ? 'active' : ''}
              onClick={() => setAuthMode('login')}
            >
              Connexion
            </button>
            <button 
              type="button"
              className={authMode === 'signup' ? 'active' : ''}
              onClick={() => setAuthMode('signup')}
            >
              Inscription
            </button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="auth-form">
              <input 
                type="email" 
                name="email" 
                placeholder="Email" 
                required 
                autoFocus
                className="form-input"
              />
              <input 
                type="password" 
                name="password" 
                placeholder="Mot de passe" 
                required
                className="form-input"
              />
              <button type="submit" className="btn-primary">
                Se connecter
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="auth-form">
              <input 
                type="email" 
                name="email" 
                placeholder="Email" 
                required 
                autoFocus
                className="form-input"
              />
              <input 
                type="password" 
                name="password" 
                placeholder="Mot de passe (min 6 caractères)" 
                required
                minLength="6"
                className="form-input"
              />
              <button type="submit" className="btn-primary">
                S'inscrire
              </button>
              <p className="auth-hint">
                Vous recevrez un email de confirmation
              </p>
            </form>
          )}
        </div>

        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');

          * { margin: 0; padding: 0; box-sizing: border-box; }

          .auth-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Outfit', sans-serif;
            padding: 2rem;
          }

          .auth-container.dark {
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            color: #f8fafc;
          }

          .auth-container.light {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            color: #0f172a;
          }

          .auth-box {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 3rem;
            max-width: 450px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }

          .auth-container.light .auth-box {
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(0, 0, 0, 0.1);
          }

          .logo-auth {
            text-align: center;
            margin-bottom: 2rem;
          }

          .logo-auth svg {
            color: #22d3ee;
            margin-bottom: 1rem;
          }

          .logo-auth h1 {
            font-size: 2.5rem;
            font-weight: 700;
            background: linear-gradient(135deg, #22d3ee, #10b981);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .logo-auth p {
            color: #94a3b8;
            margin-top: 0.5rem;
          }

          .auth-tabs {
            display: flex;
            gap: 0.5rem;
            background: rgba(0, 0, 0, 0.2);
            padding: 0.25rem;
            border-radius: 12px;
            margin-bottom: 2rem;
          }

          .auth-tabs button {
            flex: 1;
            padding: 0.75rem;
            border: none;
            background: transparent;
            color: #94a3b8;
            font-family: inherit;
            font-weight: 500;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .auth-tabs button.active {
            background: #22d3ee;
            color: white;
          }

          .auth-form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .form-input {
            width: 100%;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: inherit;
            font-family: inherit;
            font-size: 1rem;
          }

          .auth-container.light .form-input {
            background: rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(0, 0, 0, 0.1);
          }

          .form-input:focus {
            outline: none;
            border-color: #22d3ee;
            box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.1);
          }

          .btn-primary {
            padding: 1rem;
            background: #22d3ee;
            color: white;
            border: none;
            border-radius: 12px;
            font-family: inherit;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-primary:hover {
            background: #10b981;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(34, 211, 238, 0.3);
          }

          .auth-hint {
            text-align: center;
            font-size: 0.875rem;
            color: #94a3b8;
            margin-top: 0.5rem;
          }
        `}</style>
      </div>
    );
  }

  // Main app (same as before but with logout button)
  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      <nav className="sidebar">
        <div className="logo">
          <Zap size={28} />
          <span>bifocus</span>
        </div>

        <div className="user-info">
          <p className="user-email">{user.email}</p>
          <button type="button" onClick={handleLogout} className="logout-btn">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>

        <div className="space-switcher">
          <button 
            type="button"
            className={activeSpace === 'pro' ? 'active' : ''}
            onClick={() => setActiveSpace('pro')}
          >
            Travail
          </button>
          <button 
            type="button"
            className={activeSpace === 'personal' ? 'active' : ''}
            onClick={() => setActiveSpace('personal')}
          >
            Personnel
          </button>
        </div>

        <div className="nav-links">
          <button 
            type="button"
            className={activeView === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveView('dashboard')}
          >
            <Target size={18} />
            Dashboard
          </button>
          <button 
            type="button"
            className={activeView === 'tasks' ? 'active' : ''}
            onClick={() => setActiveView('tasks')}
          >
            <CheckCircle2 size={18} />
            Tâches
          </button>
          <button 
            type="button"
            className={activeView === 'stats' ? 'active' : ''}
            onClick={() => setActiveView('stats')}
          >
            <BarChart3 size={18} />
            Stats
          </button>
        </div>

        <button 
          type="button"
          className="theme-toggle"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          {darkMode ? 'Mode clair' : 'Mode sombre'}
        </button>
      </nav>

      <main className="main-content">
        {activeView === 'dashboard' && (
          <div className="dashboard">
            <h1>Bifocus</h1>
            <p className="subtitle">Votre cockpit de productivité</p>

            <div className="timer-section">
              <h2>Timers de productivité</h2>
              <div className="timer-grid">
                <button type="button" onClick={() => startTimer(25, 'Focus 25min')} className="timer-btn" disabled={timerActive}>
                  <Target size={24} />
                  <div>
                    <div className="timer-label">25 min</div>
                    <div className="timer-subtitle">Focus court</div>
                  </div>
                </button>
                <button type="button" onClick={() => startTimer(50, 'Deep Work 50min')} className="timer-btn" disabled={timerActive}>
                  <Zap size={24} />
                  <div>
                    <div className="timer-label">50 min</div>
                    <div className="timer-subtitle">Deep work</div>
                  </div>
                </button>
                <button type="button" onClick={() => startTimer(120, 'Focus Long 2h')} className="timer-btn" disabled={timerActive}>
                  <BarChart3 size={24} />
                  <div>
                    <div className="timer-label">2h</div>
                    <div className="timer-subtitle">Focus long</div>
                  </div>
                </button>
                <button type="button" onClick={() => startTimer(5, 'Repos yeux 5min')} className="timer-btn" disabled={timerActive}>
                  <Eye size={24} />
                  <div>
                    <div className="timer-label">5 min</div>
                    <div className="timer-subtitle">Repos yeux</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="tasks-section">
              <div className="section-header">
                <h2>Aujourd'hui</h2>
                <button type="button" onClick={() => setShowAddTask(true)} className="btn-primary">
                  <Plus size={16} /> Nouvelle tâche
                </button>
              </div>
              {tasks.filter(t => t.space === activeSpace).slice(0, 5).map(task => (
                <div key={task.id} className={`task-card ${task.status}`}>
                  <button 
                    type="button"
                    className="task-status"
                    onClick={() => updateTask(task.id, { 
                      status: task.status === 'done' ? 'todo' : 'done'
                    })}
                  >
                    {task.status === 'done' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </button>
                  <div className="task-content">
                    <h3>{task.title}</h3>
                    {task.description && <p>{task.description}</p>}
                  </div>
                  <button type="button" onClick={() => deleteTask(task.id)} className="task-delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {tasks.filter(t => t.space === activeSpace).length === 0 && (
                <div className="empty-state">
                  <p>Aucune tâche. Cliquez sur "Nouvelle tâche" pour commencer.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'tasks' && (
          <div className="tasks-view-full">
            <div className="view-header">
              <h1>Toutes les tâches</h1>
              <button type="button" onClick={() => setShowAddTask(true)} className="btn-primary">
                <Plus size={16} /> Nouvelle tâche
              </button>
            </div>

            <div className="day-tabs">
              {['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'].map(day => {
                const dayTasks = tasks.filter(t => t.space === activeSpace && t.day === day);
                return (
                  <div key={day} className="day-column">
                    <h3 className="day-title">
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                      <span className="task-count">({dayTasks.length})</span>
                    </h3>
                    <div className="day-tasks">
                      {dayTasks.map(task => (
                        <div key={task.id} className={`task-card-mini ${task.status} ${task.priority}`}>
                          <button 
                            type="button"
                            className="task-status"
                            onClick={() => updateTask(task.id, { 
                              status: task.status === 'done' ? 'todo' : 'done'
                            })}
                          >
                            {task.status === 'done' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                          </button>
                          <div className="task-content-mini">
                            <h4>{task.title}</h4>
                            {task.description && <p>{task.description}</p>}
                            <div className="task-meta-mini">
                              <span><Clock size={12} /> {task.estimated_minutes || 30}min</span>
                              {task.priority === 'critical' && <span className="badge-critical">Critique</span>}
                              {task.priority === 'high' && <span className="badge-high">Haute</span>}
                            </div>
                          </div>
                          <button type="button" onClick={() => deleteTask(task.id)} className="task-delete-mini">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      {dayTasks.length === 0 && (
                        <div className="empty-day">Aucune tâche</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeView === 'stats' && (
          <div className="stats-view">
            <h1>Statistiques</h1>
            <div className="stats-grid">
              <div className="stat-card">
                <Clock size={32} />
                <div className="stat-value">{stats.focusTime || 0} min</div>
                <div className="stat-label">Temps de focus</div>
              </div>
              <div className="stat-card">
                <CheckCircle2 size={32} />
                <div className="stat-value">{stats.tasksCompleted || 0}</div>
                <div className="stat-label">Tâches terminées</div>
              </div>
              <div className="stat-card">
                <Eye size={32} />
                <div className="stat-value">{stats.breaks || 0}</div>
                <div className="stat-label">Pauses prises</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {timerActive && (
        <div 
          className={`timer-widget ${isDragging ? 'dragging' : ''}`}
          style={{ left: `${widgetPos.x}px`, top: `${widgetPos.y}px` }}
          onMouseDown={handleWidgetMouseDown}
        >
          <div className="widget-header">
            <span>⏱️ {timerType}</span>
          </div>
          <div className="widget-time">{formatTime(timerSeconds)}</div>
          <div className="widget-progress">
            <div className="widget-progress-bar" style={{ width: `${(timerSeconds / timerInitialSeconds) * 100}%` }}></div>
          </div>
          <div className="widget-controls">
            {timerPaused ? (
              <button type="button" onClick={resumeTimer} className="widget-btn">
                <Play size={16} />
              </button>
            ) : (
              <button type="button" onClick={pauseTimer} className="widget-btn">
                <Pause size={16} />
              </button>
            )}
            <button type="button" onClick={stopTimer} className="widget-btn stop">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {showAddTask && (
        <div className="modal-overlay" onClick={() => setShowAddTask(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nouvelle tâche</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              addTask({
                title: formData.get('title'),
                description: formData.get('description'),
                day: formData.get('day'),
                estimatedMinutes: parseInt(formData.get('estimatedMinutes') || '30'),
                priority: formData.get('priority') || 'normal'
              });
            }}>
              <input name="title" placeholder="Titre de la tâche" className="form-input" required autoFocus />
              <textarea name="description" placeholder="Description (optionnel)" className="form-textarea" />
              
              <div className="form-row">
                <div className="form-field">
                  <label>Jour</label>
                  <select name="day" className="form-select" required>
                    <option value="">Choisir un jour</option>
                    <option value="lundi">Lundi</option>
                    <option value="mardi">Mardi</option>
                    <option value="mercredi">Mercredi</option>
                    <option value="jeudi">Jeudi</option>
                    <option value="vendredi">Vendredi</option>
                    <option value="samedi">Samedi</option>
                    <option value="dimanche">Dimanche</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Priorité</label>
                  <select name="priority" className="form-select">
                    <option value="normal">Normale</option>
                    <option value="high">Haute</option>
                    <option value="critical">Critique</option>
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label>Temps estimé (minutes)</label>
                <input name="estimatedMinutes" type="number" min="5" step="5" defaultValue="30" className="form-input" />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowAddTask(false)} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .app {
          min-height: 100vh;
          display: flex;
          font-family: 'Outfit', sans-serif;
        }

        .app.dark {
          --bg: #0a0a0a;
          --bg-secondary: #111;
          --bg-tertiary: #1a1a1a;
          --text: #f8fafc;
          --text-secondary: #cbd5e1;
          --border: #1e293b;
          --accent: #22d3ee;
          --shadow: rgba(0,0,0,0.5);
        }

        .app.light {
          --bg: #ffffff;
          --bg-secondary: #f8fafc;
          --bg-tertiary: #f1f5f9;
          --text: #0f172a;
          --text-secondary: #475569;
          --border: #e2e8f0;
          --accent: #3b82f6;
          --shadow: rgba(0,0,0,0.1);
        }

        .app { background: var(--bg); color: var(--text); }

        .sidebar {
          width: 280px;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border);
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--accent);
        }

        .user-info {
          padding: 1rem;
          background: var(--bg-tertiary);
          border-radius: 12px;
        }

        .user-email {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.5rem;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-secondary);
          font-family: inherit;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          background: var(--bg);
          color: var(--text);
        }

        .space-switcher {
          display: flex;
          gap: 0.5rem;
          background: var(--bg-tertiary);
          padding: 0.25rem;
          border-radius: 12px;
        }

        .space-switcher button {
          flex: 1;
          padding: 0.75rem;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-family: inherit;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
        }

        .space-switcher button.active {
          background: var(--accent);
          color: white;
        }

        .nav-links {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-links button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-family: inherit;
          font-weight: 500;
          border-radius: 10px;
          cursor: pointer;
          text-align: left;
        }

        .nav-links button.active {
          background: var(--bg-tertiary);
          color: var(--accent);
        }

        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border: 1px solid var(--border);
          background: var(--bg);
          color: var(--text-secondary);
          font-family: inherit;
          font-weight: 500;
          border-radius: 10px;
          cursor: pointer;
          margin-top: auto;
        }

        .main-content {
          flex: 1;
          padding: 3rem;
          overflow-y: auto;
        }

        h1 { font-size: 3rem; font-weight: 700; margin-bottom: 0.5rem; }
        .subtitle { color: var(--text-secondary); font-size: 1.125rem; margin-bottom: 3rem; }

        .timer-section { margin-bottom: 3rem; }
        h2 { font-size: 1.5rem; font-weight: 600; margin-bottom: 1.5rem; }

        .timer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .timer-btn {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: var(--bg-secondary);
          border: 2px solid var(--border);
          border-radius: 16px;
          cursor: pointer;
          font-family: inherit;
          color: var(--text);
          transition: all 0.2s;
        }

        .timer-btn:hover:not(:disabled) {
          border-color: var(--accent);
          transform: translateY(-2px);
        }

        .timer-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .timer-label { font-size: 1.25rem; font-weight: 700; }
        .timer-subtitle { font-size: 0.875rem; color: var(--text-secondary); }

        .tasks-section { margin-top: 3rem; }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 12px;
          font-family: inherit;
          font-weight: 600;
          cursor: pointer;
        }

        .task-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 16px;
          margin-bottom: 1rem;
        }

        .task-card.done { opacity: 0.6; }
        .task-card.done h3 { text-decoration: line-through; }

        .task-status {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0;
        }

        .task-content { flex: 1; }
        .task-content h3 { font-size: 1.125rem; font-weight: 600; }
        .task-content p { color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.25rem; }

        .task-delete {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
        }

        .task-delete:hover { background: var(--bg-tertiary); }

        .empty-state {
          padding: 3rem;
          text-align: center;
          color: var(--text-secondary);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .stat-card {
          padding: 2rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 20px;
          text-align: center;
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--accent);
          margin: 1rem 0;
        }

        .stat-label { color: var(--text-secondary); }

        .tasks-view-full { max-width: 100%; }
        .view-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .view-header h1 { font-size: 2rem; margin: 0; }

        .day-tabs {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1rem;
          overflow-x: auto;
        }

        @media (max-width: 1400px) {
          .day-tabs {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (max-width: 900px) {
          .day-tabs {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .day-column {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1rem;
          min-width: 200px;
        }

        .day-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .task-count {
          font-size: 0.875rem;
          color: var(--text-secondary);
          font-weight: 400;
        }

        .day-tasks {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .task-card-mini {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 12px;
          transition: all 0.2s;
        }

        .task-card-mini:hover {
          border-color: var(--accent);
        }

        .task-card-mini.critical {
          border-left: 3px solid #ef4444;
        }

        .task-card-mini.high {
          border-left: 3px solid #f59e0b;
        }

        .task-card-mini.done {
          opacity: 0.6;
        }

        .task-card-mini.done h4 {
          text-decoration: line-through;
        }

        .task-content-mini {
          flex: 1;
          min-width: 0;
        }

        .task-content-mini h4 {
          font-size: 0.95rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .task-content-mini p {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .task-meta-mini {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .task-meta-mini span {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .badge-critical {
          background: #ef4444;
          color: white;
          padding: 0.125rem 0.5rem;
          border-radius: 6px;
          font-weight: 600;
        }

        .badge-high {
          background: #f59e0b;
          color: white;
          padding: 0.125rem 0.5rem;
          border-radius: 6px;
          font-weight: 600;
        }

        .task-delete-mini {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.25rem;
          opacity: 0;
          transition: all 0.2s;
        }

        .task-card-mini:hover .task-delete-mini {
          opacity: 1;
        }

        .task-delete-mini:hover {
          color: #ef4444;
        }

        .empty-day {
          padding: 2rem 1rem;
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .timer-widget {
          position: fixed;
          z-index: 9999;
          background: var(--bg-secondary);
          border: 2px solid var(--accent);
          border-radius: 16px;
          padding: 1rem;
          box-shadow: 0 12px 40px var(--shadow), 0 0 30px rgba(34, 211, 238, 0.4);
          cursor: move;
          user-select: none;
          min-width: 200px;
          backdrop-filter: blur(10px);
        }

        .timer-widget.dragging {
          cursor: grabbing;
          box-shadow: 0 16px 50px var(--shadow), 0 0 40px rgba(34, 211, 238, 0.6);
        }

        .widget-header {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
          text-align: center;
        }

        .widget-time {
          font-size: 2.5rem;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
          color: var(--accent);
          text-align: center;
          margin-bottom: 0.75rem;
          text-shadow: 0 0 20px rgba(34, 211, 238, 0.4);
        }

        .widget-progress {
          height: 4px;
          background: var(--bg-tertiary);
          border-radius: 2px;
          margin-bottom: 0.75rem;
          overflow: hidden;
        }

        .widget-progress-bar {
          height: 100%;
          background: var(--accent);
          transition: width 1s linear;
        }

        .widget-controls {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }

        .widget-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          color: var(--text);
          transition: all 0.2s;
        }

        .widget-btn:hover {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
        }

        .widget-btn.stop { background: #ef4444; border-color: #ef4444; color: white; }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 2rem;
          max-width: 600px;
          width: 90%;
        }

        .modal h2 { font-size: 1.75rem; margin-bottom: 1.5rem; }

        .form-input, .form-textarea {
          width: 100%;
          padding: 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          color: var(--text);
          font-family: inherit;
          margin-bottom: 1rem;
        }

        .form-textarea { min-height: 100px; resize: vertical; }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-field label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .form-select {
          width: 100%;
          padding: 1rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          color: var(--text);
          font-family: inherit;
        }

        .form-select:focus {
          outline: none;
          border-color: var(--accent);
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .btn-secondary {
          padding: 0.75rem 1.5rem;
          background: var(--bg-tertiary);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 12px;
          font-family: inherit;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default BiFocus;
