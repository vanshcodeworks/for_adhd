import React, { useState, useEffect } from 'react';
import { 
  Settings, Plus, ChevronLeft, ChevronRight, Activity, 
  BrainCircuit, CheckCircle2, Play, Pause, RotateCcw, 
  X, Target, BarChart3, CalendarDays, Check
} from "lucide-react";
import { 
  format, addMonths, subMonths, isSameDay, isToday, getDate, 
  getDaysInMonth, startOfMonth 
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- CONSTANTS & CONFIG ---
const HABIT_COLORS = {
  red: { bg: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500', ring: 'ring-rose-200' },
  green: { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', ring: 'ring-emerald-200' },
  yellow: { bg: 'bg-amber-400', text: 'text-amber-500', border: 'border-amber-400', ring: 'ring-amber-200' },
  blue: { bg: 'bg-sky-500', text: 'text-sky-500', border: 'border-sky-500', ring: 'ring-sky-200' },
} as const;

type HabitColor = keyof typeof HABIT_COLORS;

// --- UTILITIES ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- TYPES ---
interface Day {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
}

interface Priority {
  id: number;
  text: string;
  done: boolean;
}

interface Habit {
  id: number;
  name: string;
  color: HabitColor;
  done: Record<string, boolean>;
}

// --- CLEAN CALENDAR COMPONENT ---
const ScrollbarHide = () => (
  <style>{`
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  `}</style>
);

interface CleanCalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  events?: Record<string, string[]>;
}

const CleanCalendar = React.forwardRef<HTMLDivElement, CleanCalendarProps>(
  ({ className, selectedDate: propSelectedDate, onDateSelect, events = {}, ...props }, ref) => {
    const [currentMonth, setCurrentMonth] = React.useState(propSelectedDate || new Date());
    const [selectedDate, setSelectedDate] = React.useState(propSelectedDate || new Date());

    const monthDays = React.useMemo(() => {
        const start = startOfMonth(currentMonth);
        const totalDays = getDaysInMonth(currentMonth);
        const days: Day[] = [];
        for (let i = 0; i < totalDays; i++) {
            const date = new Date(start.getFullYear(), start.getMonth(), i + 1);
            days.push({
                date,
                isToday: isToday(date),
                isSelected: isSameDay(date, selectedDate),
            });
        }
        return days;
    }, [currentMonth, selectedDate]);

    const handleDateClick = (date: Date) => {
      setSelectedDate(date);
      onDateSelect?.(date);
    };
    
    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    return (
      <div
        ref={ref}
        className={cn(
          "w-full bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] border border-white/60",
          className
        )}
        {...props}
      >
        <ScrollbarHide />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Timeline</h2>
          </div>
          <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50/50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200">
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="my-5 flex items-center justify-between">
            <AnimatePresence mode="wait">
              <motion.p 
                key={format(currentMonth, "MMMM")}
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.2 }}
                className="text-2xl font-bold text-slate-900 tracking-tight"
              >
                  {format(currentMonth, "MMMM")} <span className="text-slate-400 font-medium">{format(currentMonth, "yyyy")}</span>
              </motion.p>
            </AnimatePresence>
            <div className="flex items-center space-x-1">
                <button onClick={handlePrevMonth} className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200">
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={handleNextMonth} className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200">
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>
        </div>

        {/* Scrollable Monthly Calendar Grid */}
        <div className="overflow-x-auto scrollbar-hide -mx-6 px-6 relative">
            <div className="flex space-x-3 pb-2 min-w-max">
                {monthDays.map((day) => {
                    const dateKey = format(day.date, "yyyy-MM-dd");
                    const hasEvents = (events[dateKey] || []).length > 0;
                    
                    return (
                    <div key={dateKey} className="flex flex-col items-center space-y-2 flex-shrink-0">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            {format(day.date, "E").charAt(0)}
                        </span>
                        <button
                            onClick={() => handleDateClick(day.date)}
                            className={cn(
                                "flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-medium transition-all duration-300 relative focus:outline-none",
                                {
                                    "bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105 font-bold": day.isSelected,
                                    "hover:bg-white text-slate-600": !day.isSelected,
                                    "bg-white/60 text-slate-900 ring-1 ring-inset ring-slate-200": day.isToday && !day.isSelected,
                                }
                            )}
                        >
                            {day.isToday && !day.isSelected && (
                                <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-slate-900"></span>
                            )}
                            {hasEvents && !day.isSelected && (
                                <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-sky-500 ring-2 ring-white"></span>
                            )}
                            {hasEvents && day.isSelected && (
                                <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-white"></span>
                            )}
                            {getDate(day.date)}
                        </button>
                    </div>
                )})}
            </div>
        </div>
      </div>
    );
  }
);
CleanCalendar.displayName = "CleanCalendar";

// --- MAIN APP COMPONENT ---
export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [events, setEvents] = useState<Record<string, string[]>>({});
  const [notes, setNotes] = useState('');

  const [newEvent, setNewEvent] = useState('');
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitColor, setNewHabitColor] = useState<HabitColor>('green');
  
  // Timer State & Settings
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isEditingTimer, setIsEditingTimer] = useState(false);

  // Initialization
  useEffect(() => {
    const defaultPriorities = [
      { id: 1, text: 'Identify the most important task', done: false },
      { id: 2, text: 'Drink a glass of water', done: false },
      { id: 3, text: 'Clear physical workspace', done: false },
    ];
    const defaultHabits: Habit[] = [
      { id: 1, name: 'Medication / Supplements', color: 'blue', done: {} },
      { id: 2, name: '15 Min Walk', color: 'green', done: {} },
    ];

    try {
      setPriorities(JSON.parse(localStorage.getItem('adhd_premium_prio') || 'null') || defaultPriorities);
      
      const loadedHabits = JSON.parse(localStorage.getItem('adhd_premium_habits') || 'null');
      if (loadedHabits) {
        setHabits(loadedHabits.map((h: any) => ({ ...h, color: h.color || 'blue' })));
      } else {
        setHabits(defaultHabits);
      }
      
      setEvents(JSON.parse(localStorage.getItem('adhd_premium_events') || 'null') || {});
      setNotes(localStorage.getItem('adhd_premium_notes') || '');

      const savedFocus = Number(localStorage.getItem('adhd_premium_focus_min'));
      const savedBreak = Number(localStorage.getItem('adhd_premium_break_min'));
      
      if (savedFocus > 0) {
        setFocusMinutes(savedFocus);
        setTimerSeconds(savedFocus * 60);
      }
      if (savedBreak > 0) setBreakMinutes(savedBreak);

    } catch {
      setPriorities(defaultPriorities);
      setHabits(defaultHabits);
    }
    setIsLoaded(true);
  }, []);

  // Save State
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('adhd_premium_prio', JSON.stringify(priorities));
    localStorage.setItem('adhd_premium_habits', JSON.stringify(habits));
    localStorage.setItem('adhd_premium_events', JSON.stringify(events));
    localStorage.setItem('adhd_premium_notes', notes);
    localStorage.setItem('adhd_premium_focus_min', String(focusMinutes));
    localStorage.setItem('adhd_premium_break_min', String(breakMinutes));
  }, [priorities, habits, events, notes, focusMinutes, breakMinutes, isLoaded]);

  // Timer Effect
  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          const nextMode = timerMode === 'focus' ? 'break' : 'focus';
          setTimerMode(nextMode);
          return nextMode === 'focus' ? focusMinutes * 60 : breakMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning, timerMode, focusMinutes, breakMinutes]);

  // Handlers
  const handleTimerChange = (type: 'focus' | 'break', val: string) => {
    const mins = Math.max(1, Math.min(120, Number(val) || 1));
    if (type === 'focus') {
      setFocusMinutes(mins);
      if (timerMode === 'focus' && !timerRunning) setTimerSeconds(mins * 60);
    } else {
      setBreakMinutes(mins);
      if (timerMode === 'break' && !timerRunning) setTimerSeconds(mins * 60);
    }
  };

  const togglePriority = (id: number) => setPriorities(prev => prev.map(p => p.id === id ? { ...p, done: !p.done } : p));
  const editPriority = (id: number, text: string) => setPriorities(prev => prev.map(p => p.id === id ? { ...p, text } : p));
  
  const toggleHabit = (id: number, dateStr: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, done: { ...h.done, [dateStr]: !h.done[dateStr] } } : h));
  };
  const deleteHabit = (id: number) => setHabits(prev => prev.filter(h => h.id !== id));

  const addEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.trim()) return;
    const dk = format(selectedDate, "yyyy-MM-dd");
    setEvents(prev => ({ ...prev, [dk]: [...(prev[dk] || []), newEvent.trim()] }));
    setNewEvent('');
  };

  if (!isLoaded) return null;

  // Derived Data
  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  const selectedDayEvents = events[selectedDateKey] || [];
  
  const daysInCurrentMonth = getDaysInMonth(new Date());
  
  // Data for the entire current month
  const currentMonthDays = Array.from({ length: daysInCurrentMonth }).map((_, i) => {
    const dObj = new Date(new Date().getFullYear(), new Date().getMonth(), i + 1);
    return {
      day: i + 1,
      dateStr: format(dObj, 'yyyy-MM-dd'),
      isToday: isToday(dObj)
    };
  });

  const graphData = currentMonthDays.map(d => ({
    ...d,
    completedHabits: habits.filter(h => h.done[d.dateStr])
  }));
  
  const maxAchieved = Math.max(...graphData.map(d => d.completedHabits.length), 1);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-rose-200/50 relative overflow-hidden">
      
      {/* Dynamic Warm Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-rose-200/40 to-orange-100/40 blur-[100px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-amber-200/40 via-yellow-100/30 to-transparent blur-[120px]" />
        <div className="absolute top-[30%] left-[20%] w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-pink-100/30 to-transparent blur-[100px]" />
      </div>

      {/* Subtle Dot Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.04] z-0"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}
      />
      
      <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-10 flex flex-col gap-10 relative z-10">
        
        {/* HEADER: Calm & Clear */}
        <header className="flex flex-col gap-2 pt-4">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900"
          >
            Welcome back.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="text-base text-slate-500 max-w-2xl font-medium"
          >
            This is your clean space. <strong className="text-slate-800">1.</strong> Focus on 3 priorities. <strong className="text-slate-800">2.</strong> Track routines. <strong className="text-slate-800">3.</strong> Clear your mind.
          </motion.p>
        </header>

        {/* MAIN LAYOUT: 3 Columns on Desktop */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* COLUMN 1: FOCUS & PRIORITIES (Span 4) */}
          <div className="xl:col-span-4 flex flex-col gap-8">
            
            {/* Priorities Panel */}
            <div className="bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-2xl rounded-3xl p-7 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] border border-white/60 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              
              <div className="flex items-center gap-3 mb-8 relative z-10">
                <Target className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Top 3 Priorities</h2>
              </div>
              
              <div className="flex flex-col gap-5 relative z-10">
                {priorities.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-4 group">
                    <button 
                      onClick={() => togglePriority(p.id)}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2",
                        p.done ? "bg-slate-900 border-slate-900 text-white scale-110 shadow-md shadow-slate-900/20" : "border-slate-200 hover:border-slate-400 text-transparent bg-white/50"
                      )}
                    >
                      <motion.div
                        initial={false}
                        animate={{ scale: p.done ? 1 : 0, opacity: p.done ? 1 : 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </motion.div>
                    </button>
                    <div className="relative flex-1">
                      <input
                        value={p.text}
                        onChange={e => editPriority(p.id, e.target.value)}
                        className={cn(
                          "bg-transparent border-none outline-none text-base w-full transition-all duration-300 placeholder:text-slate-300",
                          p.done ? "text-slate-400" : "text-slate-700 font-medium"
                        )}
                        placeholder={`Define priority ${i + 1}...`}
                      />
                      {/* Animated Strikethrough Line */}
                      <motion.div 
                        initial={false}
                        animate={{ width: p.done ? '100%' : '0%' }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-slate-300 pointer-events-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Focus Timer Panel */}
            <div className="bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] border border-white/60 flex flex-col items-center justify-center text-center relative overflow-hidden">
              
              {/* Settings Toggle */}
              <button 
                onClick={() => setIsEditingTimer(!isEditingTimer)}
                className="absolute top-5 right-5 p-2 text-slate-300 hover:text-slate-600 transition-colors z-20 outline-none focus-visible:ring-2 focus-visible:ring-slate-200 rounded-full"
              >
                <Settings className="w-4 h-4" />
              </button>

              <span className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4 relative z-10">
                {timerMode === 'focus' ? 'Focus Session' : 'Short Break'}
              </span>

              <div className="text-7xl font-semibold text-slate-900 tabular-nums tracking-tighter mb-8 relative z-10">
                {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:{String(timerSeconds % 60).padStart(2, '0')}
              </div>
              
              <AnimatePresence>
                {isEditingTimer && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="flex items-center gap-6 overflow-hidden relative z-10 w-full justify-center"
                  >
                    <div className="flex flex-col gap-2 text-center">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Focus (min)</label>
                      <input 
                        type="number" 
                        value={focusMinutes} 
                        onChange={e => handleTimerChange('focus', e.target.value)} 
                        className="w-20 bg-white/60 border border-slate-200 rounded-xl p-2 text-center font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white transition-colors" 
                      />
                    </div>
                    <div className="flex flex-col gap-2 text-center">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Break (min)</label>
                      <input 
                        type="number" 
                        value={breakMinutes} 
                        onChange={e => handleTimerChange('break', e.target.value)} 
                        className="w-20 bg-white/60 border border-slate-200 rounded-xl p-2 text-center font-semibold text-slate-700 outline-none focus:border-slate-400 focus:bg-white transition-colors" 
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex items-center gap-4 relative z-10">
                <button 
                  onClick={() => { setTimerRunning(!timerRunning); setIsEditingTimer(false); }}
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl outline-none focus-visible:ring-4 focus-visible:ring-slate-200",
                    timerRunning 
                      ? "bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600" 
                      : "bg-slate-900 text-white shadow-slate-900/20 hover:scale-105"
                  )}
                >
                  {timerRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                </button>
                <button 
                  onClick={() => { 
                    setTimerRunning(false); 
                    setTimerSeconds(timerMode === 'focus' ? focusMinutes * 60 : breakMinutes * 60); 
                  }}
                  className="w-12 h-12 rounded-full bg-white/60 border border-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-100 hover:text-slate-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>

          </div>

          {/* COLUMN 2: HABITS & GRAPH (Span 4) */}
          <div className="xl:col-span-4 flex flex-col gap-8 h-full">
            
            {/* Habit Tracker with Full Month Matrix Grid */}
            <div className="bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] border border-white/60 flex-1 overflow-hidden flex flex-col relative">
              <div className="flex items-center gap-3 mb-6 shrink-0 relative z-10">
                <Activity className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Routines Matrix</h2>
              </div>
              
              <div className="overflow-x-auto pb-4 scrollbar-hide relative z-10">
                <table className="w-full text-left border-collapse min-w-max">
                  <thead>
                    <tr>
                      <th className="p-2 min-w-[140px] sm:min-w-[180px] bg-white/90 backdrop-blur-md sticky left-0 z-30 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        Protocol
                      </th>
                      {currentMonthDays.map(day => (
                        <th key={day.day} className="p-1 pb-3 text-center text-[10px] font-semibold text-slate-400 min-w-[32px] border-b border-slate-100">
                          {String(day.day).padStart(2, '0')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {habits.map((h) => (
                      <tr key={h.id} className="group hover:bg-slate-50/40 transition-colors">
                        <td className="p-2 py-3 bg-white/80 backdrop-blur-md group-hover:bg-slate-50/90 sticky left-0 z-20 transition-colors">
                          <div className="flex justify-between items-center pr-2">
                            <div className="flex items-center gap-2.5">
                              <div className={cn("w-2 h-2 rounded-full", HABIT_COLORS[h.color].bg)} />
                              <span className="text-sm font-medium text-slate-700 whitespace-nowrap">{h.name}</span>
                            </div>
                            <button onClick={() => deleteHabit(h.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 outline-none">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        {currentMonthDays.map(day => {
                          const isDone = h.done[day.dateStr];
                          return (
                            <td key={day.day} className="p-1 py-3 text-center relative">
                              {/* Horizontal tracking line helper on hover */}
                              <div className="absolute inset-y-0 left-0 right-0 border-y border-transparent group-hover:border-slate-100 pointer-events-none -z-10" />
                              
                              <button
                                onClick={() => toggleHabit(h.id, day.dateStr)}
                                className={cn(
                                  "w-6 h-6 rounded-[6px] transition-all duration-200 border flex items-center justify-center mx-auto outline-none focus-visible:ring-2",
                                  HABIT_COLORS[h.color].ring,
                                  isDone
                                    ? cn(HABIT_COLORS[h.color].bg, "border-transparent text-white shadow-sm scale-110")
                                    : day.isToday
                                      ? "bg-white/60 border-slate-300"
                                      : "bg-white/40 border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
                                )}
                                title={day.dateStr}
                              >
                                  <motion.div
                                    initial={false}
                                    animate={{ scale: isDone ? 1 : 0, opacity: isDone ? 1 : 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </motion.div>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newHabitName.trim()) return;
                  setHabits(p => [...p, { id: Date.now(), name: newHabitName.trim(), color: newHabitColor, done: {} }]);
                  setNewHabitName('');
                }} 
                className="mt-auto pt-4 flex flex-col gap-3 p-4 bg-white/60 rounded-2xl border border-white/50 shrink-0 relative z-10"
              >
                <input
                  type="text"
                  value={newHabitName}
                  onChange={e => setNewHabitName(e.target.value)}
                  placeholder="Define new routine..."
                  className="w-full bg-white/80 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:border-slate-400 outline-none transition-all placeholder:text-slate-400 focus:shadow-sm focus:bg-white"
                />
                <div className="flex items-center justify-between mt-1 px-1">
                  <div className="flex items-center gap-3">
                    {(Object.keys(HABIT_COLORS) as HabitColor[]).map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewHabitColor(color)}
                        className={cn(
                          "w-5 h-5 rounded-full transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                          HABIT_COLORS[color].bg,
                          newHabitColor === color ? "ring-2 ring-offset-2 ring-slate-400 scale-110 shadow-sm" : "opacity-50 hover:opacity-100 hover:scale-105"
                        )}
                      />
                    ))}
                  </div>
                  <button type="submit" className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider">
                    Save
                  </button>
                </div>
              </form>
            </div>

            {/* Results Graph (Monthly Frequency Stacked) */}
            <div className="bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] border border-white/60 shrink-0">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Consistency</h2>
              </div>
              
              <div className="overflow-x-auto scrollbar-hide pb-2">
                <div className="flex items-end h-36 gap-2 min-w-[500px] border-b border-slate-100 pb-2">
                  {graphData.map((d) => {
                    return (
                      <div key={d.day} className="flex flex-col flex-1 min-w-[16px] items-center gap-2 group cursor-default">
                        <div className={cn(
                          "w-full rounded-[4px] transition-all flex-1 flex flex-col-reverse justify-start bg-white/40 overflow-hidden relative",
                          d.isToday && "ring-1 ring-inset ring-slate-300 bg-white/60"
                        )}>
                          {d.completedHabits.map((habit) => (
                            <motion.div 
                              layout
                              key={habit.id}
                              className={cn(
                                "w-full transition-all duration-300 ease-out relative border-t border-white/20",
                                HABIT_COLORS[habit.color].bg
                              )}
                              style={{ height: `${(1 / Math.max(maxAchieved, 1)) * 100}%`, minHeight: '8px' }}
                            />
                          ))}
                          
                          {/* Tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 absolute -mt-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg pointer-events-none z-50 whitespace-nowrap shadow-xl transition-opacity duration-200">
                            {d.completedHabits.length} units
                          </div>
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold",
                          d.isToday ? "text-slate-900" : "text-slate-400"
                        )}>
                          {String(d.day).padStart(2, '0')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* COLUMN 3: TIMELINE & BRAIN DUMP (Span 4) */}
          <div className="xl:col-span-4 flex flex-col gap-8">
            
            <CleanCalendar 
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              events={events}
            />

            {/* Events for Selected Day */}
            <div className="bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] border border-white/60 flex flex-col">
              <h3 className="font-semibold text-slate-800 mb-5 tracking-tight text-lg">
                {isToday(selectedDate) ? "Today's Schedule" : format(selectedDate, "MMMM do, yyyy")}
              </h3>
              
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[220px] scrollbar-hide mb-5">
                {selectedDayEvents.length === 0 ? (
                  <div className="text-slate-400 text-sm font-medium py-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/30">
                    No events scheduled.
                  </div>
                ) : (
                  <AnimatePresence>
                    {selectedDayEvents.map((ev, i) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={i} 
                        className="bg-white/60 border border-slate-100 rounded-2xl p-4 flex justify-between items-center text-sm group"
                      >
                        <span className="text-slate-700 font-medium">{ev}</span>
                        <button 
                          onClick={() => setEvents(p => ({ ...p, [selectedDateKey]: p[selectedDateKey].filter((_, idx) => idx !== i) }))}
                          className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 outline-none"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              <form onSubmit={addEvent} className="relative mt-auto">
                <input
                  type="text"
                  value={newEvent}
                  onChange={e => setNewEvent(e.target.value)}
                  placeholder="Add an event..."
                  className="w-full bg-white/60 border border-slate-100 rounded-2xl py-3.5 pl-5 pr-12 text-sm outline-none focus:bg-white focus:border-slate-300 focus:shadow-sm transition-all placeholder:text-slate-400 font-medium"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-md outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              </form>
            </div>

            {/* Brain Dump */}
            <div className="bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-2xl rounded-3xl p-6 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] border border-white/60 flex-1 flex flex-col min-h-[220px] relative overflow-hidden">
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-slate-50/50 rounded-full blur-3xl pointer-events-none z-0"></div>
              
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <BrainCircuit className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Brain Dump</h2>
              </div>
              
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Offload distracting thoughts here to clear your mind..."
                className="flex-1 w-full bg-white/60 border border-slate-100 rounded-2xl p-5 text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-300 focus:shadow-sm transition-all resize-none scrollbar-hide relative z-10 leading-relaxed"
              />
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}