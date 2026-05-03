import { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Terminal, Activity, Focus, X, ChevronLeft, ChevronRight, Zap, BarChart2 } from 'lucide-react';

const CATEGORIES = {
  GYM: { id: 'gym', label: 'PHYSICAL', hex: '#ccff00', border: 'border-[#ccff00]', text: 'text-[#ccff00]', bg: 'bg-[#ccff00]' },
  STUDY: { id: 'study', label: 'COGNITIVE', hex: '#00e5ff', border: 'border-[#00e5ff]', text: 'text-[#00e5ff]', bg: 'bg-[#00e5ff]' },
  WORK: { id: 'work', label: 'OUTPUT', hex: '#ff3d00', border: 'border-[#ff3d00]', text: 'text-[#ff3d00]', bg: 'bg-[#ff3d00]' },
  SELF: { id: 'self', label: 'MAINTENANCE', hex: '#ff00a0', border: 'border-[#ff00a0]', text: 'text-[#ff00a0]', bg: 'bg-[#ff00a0]' }
} as const;

type CategoryKey = keyof typeof CATEGORIES;
type HabitCompleted = Record<string, boolean>;
type EventMap = Record<string, string[]>;

type Habit = {
  id: number;
  name: string;
  category: CategoryKey;
  completed: HabitCompleted;
};

const INITIAL_HABITS: Habit[] = [
  { id: 1, name: 'HYPERTROPHY_SPLIT', category: 'GYM', completed: {} },
  { id: 2, name: 'SYS_SLEEP >= 7HR', category: 'GYM', completed: {} },
  { id: 3, name: 'DEEP_LEARNING.RS', category: 'STUDY', completed: {} },
  { id: 4, name: 'DEVPROVE_BUILD', category: 'WORK', completed: {} },
  { id: 5, name: 'DISCONNECT_WIFI', category: 'SELF', completed: {} },
];

export default function App() {
  // State Initialization
  const [currentDate, setCurrentDate] = useState(new Date());
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [events, setEvents] = useState<EventMap>({});
  const [priorities, setPriorities] = useState<string[]>(['DEPLOY BETA VERSION', 'PARSE 2 RESEARCH PAPERS', 'BENCH PRESS PR']);
  const [notes, setNotes] = useState('');
  
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [newEventText, setNewEventText] = useState('');
  const [sysTime, setSysTime] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Habit Management States
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState<CategoryKey>('GYM');
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
  const [editingHabitName, setEditingHabitName] = useState('');

  // Event Edit States
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingEventText, setEditingEventText] = useState('');

  // Terminal Line Numbers Ref
  const lineNumbersRef = useRef<HTMLDivElement | null>(null);

  // 1. Local Storage: Load Data (Runs once on mount, safe for Vercel SSR)
  useEffect(() => {
    const loadData = () => {
      const savedHabits = localStorage.getItem('cmd_habits');
      const savedEvents = localStorage.getItem('cmd_events');
      const savedPriorities = localStorage.getItem('cmd_priorities');
      const savedNotes = localStorage.getItem('cmd_notes');

      if (savedHabits) setHabits(JSON.parse(savedHabits));
      if (savedEvents) setEvents(JSON.parse(savedEvents));
      if (savedPriorities) setPriorities(JSON.parse(savedPriorities));
      if (savedNotes) setNotes(savedNotes);
      
      setIsDataLoaded(true);
    };
    loadData();
    setSysTime(new Date().toLocaleTimeString()); // Init time on client
  }, []);

  // 2. Local Storage: Save Data (Runs whenever state changes)
  useEffect(() => {
    if (!isDataLoaded) return; // Prevent overwriting with initial state before load
    localStorage.setItem('cmd_habits', JSON.stringify(habits));
    localStorage.setItem('cmd_events', JSON.stringify(events));
    localStorage.setItem('cmd_priorities', JSON.stringify(priorities));
    localStorage.setItem('cmd_notes', notes);
  }, [habits, events, priorities, notes, isDataLoaded]);

  // Clock effect
  useEffect(() => {
    const timer = setInterval(() => setSysTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calendar Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const monthName = currentDate.toLocaleString('default', { month: 'long' }).toUpperCase();

  // Telemetry Logic (Graph Data Calculation)
  const graphData = Array.from({ length: daysInMonth }).map((_, i) => {
    const day = i + 1;
    const dateKey = `${year}-${month}-${day}`;
    const completedHabits = habits.filter(habit => habit.completed[dateKey]);
    return { day, completedHabits, count: completedHabits.length };
  });
  const maxAchieved = Math.max(...graphData.map(d => d.count), 1);
  const yAxisScale = Math.max(3, maxAchieved); // Dynamic scaling: ensures bars are thick

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Handlers
  const toggleHabit = (habitId: number, day: number) => {
    const dateKey = `${year}-${month}-${day}`;
    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const newCompleted = { ...habit.completed };
        newCompleted[dateKey] = !newCompleted[dateKey];
        return { ...habit, completed: newCompleted };
      }
      return habit;
    }));
  };

  const addEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDay || !newEventText.trim()) return;
    const dateKey = `${year}-${month}-${selectedDay}`;
    setEvents(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newEventText.trim().toUpperCase()]
    }));
    setNewEventText('');
  };

  const removeEvent = (dateKey: string, index: number) => {
    setEvents(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).filter((_, i) => i !== index)
    }));
  };

  const startEditEvent = (dateKey: string, index: number, text: string) => {
    setEditingEventId(`${dateKey}-${index}`);
    setEditingEventText(text);
  };

  const saveEditEvent = (dateKey: string, index: number) => {
    if (!editingEventText.trim()) {
      removeEvent(dateKey, index);
    } else {
      setEvents(prev => {
        const dayEvents = [...(prev[dateKey] || [])];
        dayEvents[index] = editingEventText.trim().toUpperCase();
        return { ...prev, [dateKey]: dayEvents };
      });
    }
    setEditingEventId(null);
  };

  const updatePriority = (index: number, value: string) => {
    const newPriorities = [...priorities];
    newPriorities[index] = value.toUpperCase();
    setPriorities(newPriorities);
  };

  // Habit Management Handlers
  const addHabit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    setHabits([...habits, { id: Date.now(), name: newHabitName.trim().toUpperCase(), category: newHabitCategory, completed: {} }]);
    setNewHabitName('');
  };

  const deleteHabit = (id: number) => {
    setHabits(habits.filter(h => h.id !== id));
  };

  const startEditHabit = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setEditingHabitName(habit.name);
  };

  const saveEditHabit = (id: number) => {
    if (!editingHabitName.trim()) {
      setEditingHabitId(null);
      return;
    }
    setHabits(habits.map(h => h.id === id ? { ...h, name: editingHabitName.trim().toUpperCase() } : h));
    setEditingHabitId(null);
  };

  // Terminal Scroll Sync
  const handleNotesScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Prevent rendering UI until client-side data is loaded (prevents hydration mismatch on Vercel)
  if (!isDataLoaded) return <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono text-[#ccff00]">INITIALIZING_SYSTEM...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] p-2 sm:p-4 md:p-8 relative overflow-hidden font-mono selection:bg-[#ccff00] selection:text-black">
      
      {/* CSS Imports & Brutalist Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,600;1,400&display=swap');

        .font-bebas { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.05em; }
        .font-plex { font-family: 'IBM Plex Mono', monospace; }

        .bg-noise {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          pointer-events: none;
          z-index: 50;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }

        .bg-grid {
          background-size: 40px 40px;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
        }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #050505; border: 1px solid #222; }
        ::-webkit-scrollbar-thumb { background: #333; }
        ::-webkit-scrollbar-thumb:hover { background: #ccff00; }

        .glitch-hover:hover {
          animation: rgb-shift 0.3s cubic-bezier(.25, .46, .45, .94) both infinite;
        }

        @keyframes rgb-shift {
          0% { text-shadow: 2px 0 0 red, -2px 0 0 blue; }
          25% { text-shadow: -2px 0 0 red, 2px 0 0 blue; }
          50% { text-shadow: 2px 0 0 red, -2px 0 0 blue; }
          75% { text-shadow: -2px 0 0 red, 2px 0 0 blue; }
          100% { text-shadow: 0 0 0 red, 0 0 0 blue; }
        }

        .stagger-in {
          animation: fade-in-up 0.4s ease-out forwards;
          opacity: 0;
          transform: translateY(10px);
        }

        @keyframes fade-in-up {
          to { opacity: 1; transform: translateY(0); }
        }

        *:focus { outline: none; box-shadow: none; }
        input:focus, textarea:focus { border-color: #ccff00 !important; background: rgba(204, 255, 0, 0.05); }

        /* Sync text metrics for terminal */
        .terminal-metrics {
          font-size: 14px !important;
          line-height: 24px !important;
          padding-top: 8px !important;
          padding-bottom: 8px !important;
        }
      `}} />

      <div className="bg-noise"></div>
      <div className="absolute inset-0 bg-grid pointer-events-none z-0"></div>

      <div className="max-w-[1600px] mx-auto relative z-10 flex flex-col gap-6">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between border-b-2 border-white pb-4 mb-2 stagger-in">
          <div className="flex flex-col">
            <span className="text-[#ccff00] text-xs font-bold tracking-widest mb-1 flex items-center gap-2">
              <Zap className="w-3 h-3 fill-[#ccff00]" /> LOCAL_STORAGE_ACTIVE // SECURE
            </span>
            <h1 className="font-bebas text-5xl sm:text-6xl md:text-8xl leading-none tracking-tight text-white uppercase glitch-hover cursor-default">
              CMD_CENTER
            </h1>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end w-full md:w-auto border-t md:border-none border-gray-800 pt-4 md:pt-0">
            <div className="font-bebas text-3xl sm:text-4xl text-[#333]">{year} // {sysTime || '00:00:00'}</div>
            <div className="text-sm text-gray-400 mt-1 uppercase border border-gray-800 px-2 py-1 bg-black">
              LOC: {currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' }).toUpperCase()}
            </div>
          </div>
        </header>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* COLUMN 1: MACRO CALENDAR (Span 7) */}
          <section className="xl:col-span-7 bg-[#0a0a0a] border border-[#333] p-1 stagger-in" style={{ animationDelay: '0.1s' }}>
            <div className="border border-[#222] p-4 h-full relative">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#ccff00]"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#ccff00]"></div>
              
              <div className="flex flex-wrap gap-4 justify-between items-end mb-6 border-b border-[#333] pb-4">
                <h2 className="font-bebas text-3xl sm:text-4xl text-white flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" /> MACRO_TIMELINE
                </h2>
                <div className="flex items-center gap-2 bg-[#111] border border-[#333] p-1 w-full sm:w-auto justify-between">
                  <button onClick={prevMonth} className="px-2 py-1 hover:bg-[#333] text-gray-400 hover:text-white transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bebas text-xl sm:text-2xl w-24 sm:w-32 text-center text-[#ccff00] pt-1">{monthName}</span>
                  <button onClick={nextMonth} className="px-2 py-1 hover:bg-[#333] text-gray-400 hover:text-white transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Responsive Calendar Grid Wrapper */}
              <div className="overflow-x-auto">
                <div className="min-w-[600px] grid grid-cols-7 border-t border-l border-[#222]">
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                    <div key={day} className="border-b border-r border-[#222] bg-[#111] p-2 text-center text-[10px] text-gray-500 font-bold tracking-widest">
                      {day}
                    </div>
                  ))}
                  
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="border-b border-r border-[#222] bg-[#050505]/50 min-h-[80px] sm:min-h-[100px]"></div>
                  ))}
                  
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateKey = `${year}-${month}-${day}`;
                    const dayEvents = events[dateKey] || [];
                    const isSelected = selectedDay === day;
                    const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

                    return (
                      <div 
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`min-h-[80px] sm:min-h-[100px] border-b border-r border-[#222] p-2 cursor-pointer transition-all relative group
                          ${isSelected ? 'bg-[#ccff00]/10 border-[#ccff00]' : 'hover:bg-[#1a1a1a]'}
                          ${isToday && !isSelected ? 'bg-white text-black' : ''}`}
                      >
                        <span className={`font-bebas text-xl sm:text-2xl leading-none block mb-2 ${isToday ? 'text-black' : (isSelected ? 'text-[#ccff00]' : 'text-gray-600 group-hover:text-white')}`}>
                          {day.toString().padStart(2, '0')}
                        </span>
                        
                        <div className="flex flex-col gap-1">
                          {dayEvents.map((evt, idx) => {
                            const isEditing = editingEventId === `${dateKey}-${idx}`;

                            return (
                              <div key={idx} className={`text-[9px] leading-tight px-1 py-0.5 border-l-2 flex justify-between items-start group/evt
                                ${isToday ? 'border-black bg-black/10 text-black font-bold' : 'border-[#ccff00] bg-[#111] text-gray-300'}`}>
                                
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editingEventText}
                                    onChange={(e) => setEditingEventText(e.target.value)}
                                    onBlur={() => saveEditEvent(dateKey, idx)}
                                    onKeyDown={(e) => e.key === 'Enter' && saveEditEvent(dateKey, idx)}
                                    className="w-full bg-black text-[#ccff00] outline-none border border-[#ccff00] px-1 py-0.5"
                                    autoFocus
                                  />
                                ) : (
                                  <>
                                    <span 
                                      className="truncate pr-1 block cursor-text flex-1" 
                                      title={evt}
                                      onDoubleClick={(e) => { e.stopPropagation(); startEditEvent(dateKey, idx, evt); }}
                                    >
                                      {evt}
                                    </span>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); removeEvent(dateKey, idx); }}
                                      className="opacity-0 group-hover/evt:opacity-100 hover:text-red-500 transition-opacity shrink-0"
                                      title="Delete Event"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedDay && (
                <form onSubmit={addEvent} className="mt-4 flex flex-col sm:flex-row gap-2 border border-[#ccff00] bg-black p-1">
                  <div className="bg-[#ccff00] text-black font-bold text-xs flex items-center justify-center py-2 sm:py-0 px-2">
                    INPUT_EVT [{selectedDay.toString().padStart(2, '0')}]
                  </div>
                  <input
                    type="text"
                    placeholder="ENTER DATA..."
                    className="flex-1 bg-transparent border border-[#222] sm:border-none text-white text-sm uppercase px-2 py-2 sm:py-1 placeholder-gray-700"
                    value={newEventText}
                    onChange={(e) => setNewEventText(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="bg-[#111] hover:bg-[#222] text-[#ccff00] px-4 py-2 sm:py-1 text-sm font-bold border border-[#333] transition-colors">
                    EXEC
                  </button>
                </form>
              )}
            </div>
          </section>

          {/* COLUMN 2 & 3 CONTAINER (Span 5) */}
          <div className="xl:col-span-5 flex flex-col gap-6 h-full">
            
            {/* PRIORITIES: High Contrast Cards */}
            <section className="bg-[#0a0a0a] border border-[#333] p-1 stagger-in" style={{ animationDelay: '0.2s' }}>
              <div className="border border-[#222] p-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBoNDBWMEgweiIgZmlsbD0ibm9uZSIvPjxwb2x5Z29uIHBvaW50cz0iMCA0MCA0MCAwIDQwIDQwIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDEpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')]">
                <h2 className="font-bebas text-2xl sm:text-3xl text-white mb-4 flex items-center justify-between border-b border-[#333] pb-2">
                  <span><span className="text-[#ff3d00]">///</span> PRIORITY_QUEUE</span>
                  <Activity className="w-5 h-5 text-[#ff3d00]" />
                </h2>
                
                <div className="space-y-3">
                  {priorities.map((priority, idx) => (
                    <div key={idx} className="relative group border border-[#333] bg-[#050505] overflow-hidden flex">
                      <div className="absolute -right-4 -top-6 font-bebas text-6xl sm:text-8xl text-white/5 select-none pointer-events-none group-hover:text-[#ff3d00]/10 transition-colors">
                        0{idx + 1}
                      </div>
                      
                      <div className="bg-[#111] border-r border-[#333] p-2 sm:p-3 flex items-center justify-center">
                        <span className="text-[#ff3d00] font-bold text-[10px] sm:text-xs block transform -rotate-90 origin-center whitespace-nowrap tracking-widest w-4">
                          OBJ.0{idx+1}
                        </span>
                      </div>
                      
                      <textarea
                        value={priority}
                        onChange={(e) => updatePriority(idx, e.target.value)}
                        placeholder="DEFINE_OBJECTIVE..."
                        className="flex-1 bg-transparent border-none p-3 sm:p-4 text-white uppercase text-xs sm:text-sm resize-none z-10 font-bold placeholder-gray-700"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* BRAIN DUMP: Raw Terminal */}
            <section className="bg-[#0a0a0a] border border-[#333] p-1 flex-1 flex flex-col stagger-in" style={{ animationDelay: '0.3s' }}>
              <div className="border border-[#222] p-4 flex-1 flex flex-col relative bg-black">
                <div className="absolute top-2 right-2 flex gap-1 z-20">
                  <div className="w-2 h-2 bg-red-500"></div>
                  <div className="w-2 h-2 bg-yellow-500"></div>
                  <div className="w-2 h-2 bg-green-500"></div>
                </div>
                
                <h2 className="font-bebas text-xl sm:text-2xl text-gray-500 mb-4 flex items-center gap-2 relative z-20">
                  <Terminal className="w-4 h-4" /> dev_null // SCRATCHPAD
                </h2>
                
                {/* Scroll Synchronized Terminal Wrapper */}
                <div className="flex-1 relative group min-h-[150px] flex overflow-hidden border border-[#222] bg-[#050505]">
                  <div 
                    ref={lineNumbersRef}
                    className="w-6 sm:w-8 shrink-0 bg-[#0a0a0a] border-r border-[#222] text-[#333] font-bold font-mono select-none overflow-hidden terminal-metrics"
                  >
                    {Array.from({ length: Math.max(12, notes.split('\n').length + 5) }).map((_, i) => (
                      <div key={i} className="text-center">{i + 1}</div>
                    ))}
                  </div>
                  
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onScroll={handleNotesScroll}
                    spellCheck="false"
                    placeholder="// Initialize logic flows here..."
                    className="flex-1 h-full w-full bg-transparent border-none text-[#00e5ff] resize-none font-plex focus:ring-0 placeholder-[#00e5ff]/30 outline-none terminal-metrics px-3 whitespace-pre overflow-y-auto"
                  />
                </div>
              </div>
            </section>
          </div>
          
          {/* BOTTOM ROW (TELEMETRY GRAPH + HABIT MATRIX) */}
          <div className="xl:col-span-12 flex flex-col gap-6">

            {/* NEW GRAPH SECTION */}
            <section className="bg-[#0a0a0a] border border-[#333] p-1 stagger-in" style={{ animationDelay: '0.4s' }}>
              <div className="border border-[#222] p-4 bg-black relative">
                
                {/* Visual grid behind chart */}
                <div className="absolute inset-x-4 inset-y-16 flex flex-col justify-between pointer-events-none opacity-20 z-0">
                  <div className="w-full border-b border-dashed border-[#ccff00]"></div>
                  <div className="w-full border-b border-dashed border-[#ccff00]"></div>
                  <div className="w-full border-b border-[#333]"></div>
                </div>

                <div className="flex flex-wrap gap-2 items-center justify-between mb-4 border-b border-[#333] pb-2 relative z-10">
                  <h2 className="font-bebas text-2xl sm:text-3xl text-[#ccff00] flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-gray-500" /> TELEMETRY // HABIT_FREQUENCY
                  </h2>
                  <div className="text-[10px] text-gray-500 tracking-widest uppercase bg-[#111] px-2 py-1 border border-[#222]">
                    AXIS_MAX: {yAxisScale} UNITS
                  </div>
                </div>
                
                {/* Responsive Chart Wrapper */}
                <div className="overflow-x-auto relative z-10">
                  <div className="flex items-end h-32 sm:h-40 gap-1 sm:gap-2 pt-4 pb-2 min-w-[600px] xl:min-w-0">
                    {graphData.map((d) => {
                      const isToday = new Date().getDate() === d.day && new Date().getMonth() === month && new Date().getFullYear() === year;
                      
                      return (
                        <div key={d.day} className="flex flex-col flex-1 min-w-[20px] sm:min-w-[28px] items-center gap-2 group cursor-crosshair">
                          <div className={`w-full bg-[#111] border border-[#222] relative flex-1 flex flex-col-reverse justify-start overflow-hidden group-hover:border-[#ccff00] transition-colors ${isToday ? 'border-gray-500' : ''}`}>
                            {d.completedHabits.map((habit) => (
                              <div
                                key={habit.id}
                                className={`w-full ${CATEGORIES[habit.category].bg} relative border-b border-[#111]/50 opacity-90 hover:opacity-100 transition-opacity`}
                                style={{ height: `${(1 / yAxisScale) * 100}%`, minHeight: '12px' }}
                              >
                              </div>
                            ))}
                            
                            {/* Hover tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white text-black text-[10px] font-bold px-2 py-1 pointer-events-none z-50 whitespace-nowrap">
                              {d.count} EXEC
                            </div>
                          </div>
                          <span className={`text-[9px] sm:text-[10px] font-bold ${isToday ? 'text-white bg-white/20 px-1' : 'text-gray-600 group-hover:text-[#ccff00]'}`}>
                            {d.day.toString().padStart(2, '0')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* HABIT MATRIX */}
            <section className="bg-[#0a0a0a] border border-[#333] p-1 stagger-in" style={{ animationDelay: '0.5s' }}>
              <div className="border border-[#222] p-4 overflow-hidden relative">
                
                <div className="flex flex-wrap gap-2 items-center justify-between mb-6 border-b border-[#333] pb-4">
                  <h2 className="font-bebas text-3xl sm:text-4xl text-white flex items-center gap-3">
                    <Focus className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" /> MICRO_EXECUTION
                  </h2>
                  <div className="text-[10px] sm:text-xs text-gray-500 tracking-widest uppercase border border-[#333] px-2 sm:px-3 py-1 bg-[#111]">
                    Status: Tracking Active
                  </div>
                </div>
                
                <div className="overflow-x-auto pb-4">
                  <table className="w-full text-left border-collapse border-spacing-0 min-w-[800px] xl:min-w-0">
                    <thead>
                      <tr>
                        <th className="p-2 sm:p-3 min-w-[200px] sm:min-w-[250px] border-b border-r border-[#333] bg-[#050505] sticky left-0 z-20 text-[10px] sm:text-xs font-bold text-gray-500 tracking-widest uppercase">
                          Protocol_Name
                        </th>
                        {Array.from({ length: daysInMonth }).map((_, i) => (
                          <th key={i} className="p-1 sm:p-2 border-b border-[#333] text-center text-[9px] sm:text-[10px] font-bold text-gray-600 min-w-[28px] sm:min-w-[36px] bg-[#111]">
                            {(i + 1).toString().padStart(2, '0')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {habits.map((habit) => {
                        const catStyle = CATEGORIES[habit.category];
                        return (
                          <tr key={habit.id} className="group">
                            <td className="p-0 border-b border-r border-[#222] bg-[#0a0a0a] sticky left-0 z-20 group-hover:bg-[#111] transition-colors">
                              <div className="flex items-stretch h-full">
                                <div className={`w-1.5 shrink-0 ${catStyle.bg}`}></div>
                                <div className="p-2 sm:p-3 flex flex-col justify-center flex-1 relative group/cell">
                                  {editingHabitId === habit.id ? (
                                    <input 
                                      type="text" 
                                      value={editingHabitName}
                                      onChange={(e) => setEditingHabitName(e.target.value)}
                                      onBlur={() => saveEditHabit(habit.id)}
                                      onKeyDown={(e) => e.key === 'Enter' && saveEditHabit(habit.id)}
                                      className="bg-black text-[#ccff00] text-[10px] sm:text-xs font-bold uppercase w-full outline-none border border-[#ccff00] px-1 py-0.5"
                                      autoFocus
                                    />
                                  ) : (
                                    <>
                                      <span 
                                        onDoubleClick={() => startEditHabit(habit)}
                                        className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider cursor-text"
                                        title="Double-click to edit"
                                      >
                                        {habit.name}
                                      </span>
                                      <span className={`text-[8px] sm:text-[9px] ${catStyle.text} uppercase tracking-widest mt-0.5 font-bold`}>
                                        [{catStyle.label}]
                                      </span>
                                    </>
                                  )}
                                  
                                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 transition-opacity flex gap-1 bg-[#111] pl-2">
                                     <button onClick={() => deleteHabit(habit.id)} className="text-gray-500 hover:text-[#ff3d00] transition-colors" title="Delete Protocol">
                                       <X className="w-4 h-4" />
                                     </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                              const day = i + 1;
                              const dateKey = `${year}-${month}-${day}`;
                              const isCompleted = habit.completed[dateKey];
                              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                              
                              return (
                                <td key={day} className={`p-1 sm:p-1.5 border-b border-[#222] text-center group-hover:bg-[#111]/50 ${isToday ? 'bg-white/5' : ''}`}>
                                  <button
                                    onClick={() => toggleHabit(habit.id, day)}
                                    className={`w-full aspect-square border transition-all flex items-center justify-center relative overflow-hidden
                                      ${isCompleted 
                                        ? `${catStyle.bg} border-transparent` 
                                        : 'border-[#333] bg-black hover:border-gray-500'}`}
                                  >
                                    {isCompleted && (
                                      <div className="absolute inset-0 bg-white/20"></div> // Subtle shine on filled box
                                    )}
                                    {!isCompleted && isToday && (
                                      <div className="w-1 h-1 bg-[#333] rounded-full"></div> // Indicator for today's empty box
                                    )}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ADD NEW PROTOCOL FORM */}
                <form onSubmit={addHabit} className="mt-4 flex flex-col sm:flex-row gap-2 border border-[#333] bg-[#050505] p-2">
                  <div className="bg-[#111] text-gray-500 font-bold text-[10px] flex items-center justify-center px-3 tracking-widest uppercase border border-[#222]">
                    + NEW_PROTOCOL
                  </div>
                  <select 
                    value={newHabitCategory}
                    onChange={(e) => setNewHabitCategory(e.target.value as CategoryKey)}
                    className="bg-black border border-[#222] text-white text-[10px] font-bold px-2 py-2 sm:py-1 uppercase focus:border-[#ccff00] outline-none"
                  >
                    {Object.values(CATEGORIES).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="ENTER PROTOCOL NAME..."
                    className="flex-1 bg-black border border-[#222] text-white text-xs uppercase px-3 py-2 sm:py-1 placeholder-gray-700 focus:border-[#ccff00] outline-none"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                  />
                  <button type="submit" className="bg-[#222] hover:bg-[#ccff00] text-gray-400 hover:text-black px-6 py-2 sm:py-1 text-xs font-bold transition-colors border border-[#333] hover:border-[#ccff00]">
                    INJECT
                  </button>
                </form>

              </div>
            </section>
          </div>
          
        </div>

        {/* CUSTOM FOOTER */}
        <footer className="mt-8 mb-4 text-center stagger-in" style={{ animationDelay: '0.6s' }}>
          <div className="border-t border-[#333] pt-6 max-w-2xl mx-auto flex flex-col items-center justify-center gap-3">
            <p className="text-gray-400 text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              MADE WITH <span className="text-[#ff00a0]">❤️</span> BY 
              <a href="https://vanshcodeworks.com" target="_blank" rel="noopener noreferrer" className="text-[#00e5ff] hover:text-[#ccff00] transition-colors underline decoration-dotted underline-offset-4">
                VANSHCODEWORKS
              </a>
            </p>
            <p className="text-[#555] text-[10px] font-mono tracking-widest bg-[#111] px-3 py-1 border border-[#222]">
              // ENGINEERED FOR ADHD SUFFERING PEOPLE // STAY FOCUSED //
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}