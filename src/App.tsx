import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Plus,
  Trash2,
  Sparkles,
  Code,
  PenTool,
  BarChart3,
  BookOpen,
  Send,
  Globe,
  Settings,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  FileDown,
  HelpCircle,
  RefreshCw,
  AlertTriangle,
  Compass,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Message,
  GroundingSource,
  ChatSession,
  Persona,
  SYSTEM_PERSONAS,
} from "./types";
import { MarkdownRenderer } from "./components/MarkdownRenderer";

const QUICK_STARTERS = [
  {
    id: "qs1",
    title: "Optimize React Performance",
    prompt: "Provide a comprehensive guide and code sample to refactor a React component to optimize rendering performance, prevent infinite render loops, and handle heavy state updates cleanly.",
    description: "Software Architect persona recommended",
    icon: Code,
    personaId: "coder",
  },
  {
    id: "qs2",
    title: "SWOT Analysis Plan",
    prompt: "Generate a strategic SWOT analysis matrix for launching an AI-assisted customer experience tool into the healthcare market. Include key compliance considerations.",
    description: "Business Strategist persona recommended",
    icon: BarChart3,
    personaId: "analyst",
  },
  {
    id: "qs3",
    title: "Executive Launch Pitch",
    prompt: "Draft an engaging, high-impact introductory email pitch targeting C-level executives for a newly developed software-defined manufacturing solution.",
    description: "Creative Copywriter persona recommended",
    icon: PenTool,
    personaId: "writer",
  },
  {
    id: "qs4",
    title: "Explain Neural Networks",
    prompt: "Explain how neural network weight optimization and backpropagation work. Use an intuitive analogy that a high school student can understand easily.",
    description: "Language Coach / Tutor recommended",
    icon: BookOpen,
    personaId: "tutor",
  },
];

export default function App() {
  // --- States ---
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [errorBanner, setErrorBanner] = useState<{
    type: string;
    message: string;
  } | null>(null);

  // Active configurations for the current active session
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("general");
  const [webSearchEnabled, setWebSearchEnabled] = useState<boolean>(false);
  const [tempMode, setTempMode] = useState<"professional" | "balanced" | "creative">("balanced");

  // References
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Initializing Sessions from localStorage ---
  useEffect(() => {
    const saved = localStorage.getItem("pro_chatbot_sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          
          // Load configurations of the first session
          setSelectedPersonaId(parsed[0].personaId || "general");
          setWebSearchEnabled(parsed[0].webSearchEnabled || false);
          setTempMode(parsed[0].temperatureMode || "balanced");
          return;
        }
      } catch (e) {
        console.error("Error loading chat sessions", e);
      }
    }

    // Initialize with a default session if empty
    const defaultSession: ChatSession = {
      id: "session-default",
      title: "New Conversation",
      messages: [],
      createdTime: Date.now(),
      personaId: "general",
      webSearchEnabled: false,
      temperatureMode: "balanced",
    };
    setSessions([defaultSession]);
    setActiveSessionId(defaultSession.id);
  }, []);

  // --- Save to localStorage whenever sessions state changes ---
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("pro_chatbot_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  // --- Sync session settings to state on session switch ---
  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setSelectedPersonaId(session.personaId || "general");
      setWebSearchEnabled(session.webSearchEnabled || false);
      setTempMode(session.temperatureMode || "balanced");
    }
    setMobileSidebarOpen(false);
    setErrorBanner(null);
  };

  // --- Update session settings state & store back to sessions ---
  const updateSessionConfig = (
    personaId: string,
    webSearch: boolean,
    temp: "professional" | "balanced" | "creative"
  ) => {
    setSelectedPersonaId(personaId);
    setWebSearchEnabled(webSearch);
    setTempMode(temp);

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            personaId,
            webSearchEnabled: webSearch,
            temperatureMode: temp,
          };
        }
        return s;
      })
    );
  };

  // --- Scroll to Bottom ---
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions, activeSessionId, isLoading]);

  // --- Handlers ---
  const createNewSession = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: "New Conversation",
      messages: [],
      createdTime: Date.now(),
      personaId: selectedPersonaId,
      webSearchEnabled: webSearchEnabled,
      temperatureMode: tempMode,
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setErrorBanner(null);
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Don't delete if it's the last session
    if (sessions.length === 1) {
      const refreshedSession: ChatSession = {
        id: "session-default",
        title: "New Conversation",
        messages: [],
        createdTime: Date.now(),
        personaId: "general",
        webSearchEnabled: false,
        temperatureMode: "balanced",
      };
      setSessions([refreshedSession]);
      setActiveSessionId("session-default");
      return;
    }

    const filtered = sessions.filter((s) => s.id !== sessionId);
    setSessions(filtered);
    
    if (activeSessionId === sessionId) {
      setActiveSessionId(filtered[0].id);
      const firstSess = filtered[0];
      setSelectedPersonaId(firstSess.personaId || "general");
      setWebSearchEnabled(firstSess.webSearchEnabled || false);
      setTempMode(firstSess.temperatureMode || "balanced");
    }
  };

  const clearCurrentChat = () => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [], title: "New Conversation" };
        }
        return s;
      })
    );
    setErrorBanner(null);
  };

  // --- Sending Message to Express API ---
  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    setErrorBanner(null);
    setInputText("");

    // Identify active session
    const activeSession = sessions.find((s) => s.id === activeSessionId);
    if (!activeSession) return;

    // 1. Create and append user message
    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    const updatedMessages = [...activeSession.messages, userMsg];

    // Optimistically update session messages
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: updatedMessages,
            // If the title is "New Conversation", update it to the user's first prompt snippet
            title: s.title === "New Conversation" ? (trimmed.length > 25 ? trimmed.substring(0, 25) + "..." : trimmed) : s.title,
          };
        }
        return s;
      })
    );

    setIsLoading(true);

    try {
      const activePersona = SYSTEM_PERSONAS.find((p) => p.id === selectedPersonaId) || SYSTEM_PERSONAS[0];
      
      // Inject some professional formatting guidelines into the instruction
      let systemInstruction = activePersona.systemInstruction;
      if (tempMode === "professional") {
        systemInstruction += " Answer with extreme professionalism, cold logical rigidity, and structural depth. Avoid any humor or conversational fluff.";
      } else if (tempMode === "creative") {
        systemInstruction += " Answer with vivid, highly engaging, imaginative descriptions. Try to explore outside-the-box answers.";
      }

      // API Call to /api/chat
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
          systemInstruction: systemInstruction,
          webSearch: webSearchEnabled,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "API_KEY_MISSING") {
          setErrorBanner({
            type: "API_KEY_MISSING",
            message: data.message,
          });
          throw new Error("Missing Gemini API Key");
        } else {
          throw new Error(data.message || "Failed to generate AI response.");
        }
      }

      // 2. Append assistant response
      const sources: GroundingSource[] = (data.groundingMetadata?.chunks || [])
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({
          title: chunk.web.title || "Web Source",
          uri: chunk.web.uri,
        }));

      const assistantMsg: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant",
        content: data.content || "I apologize, but I could not formulate a response.",
        timestamp: Date.now(),
        sources: sources.length > 0 ? sources : undefined,
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: [...updatedMessages, assistantMsg],
            };
          }
          return s;
        })
      );
    } catch (err: any) {
      console.error("Error communicating with AI endpoint:", err);
      
      // Unless it is a key configuration issue, show a standard bubble error
      if (err.message !== "Missing Gemini API Key") {
        const errorMsg: Message = {
          id: `msg-${Date.now()}-error`,
          role: "assistant",
          content: `⚠️ **System Integration Alert**\n\nFailed to establish connection. Details: ${err.message || "An unexpected network or model connection timeout occurred."}\n\n*Please verify your server and network credentials.*`,
          timestamp: Date.now(),
        };
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === activeSessionId) {
              return {
                ...s,
                messages: [...updatedMessages, errorMsg],
              };
            }
            return s;
          })
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickStarterClick = (prompt: string, personaId: string) => {
    // Switch to corresponding persona, then send message
    updateSessionConfig(personaId, webSearchEnabled, tempMode);
    handleSendMessage(prompt);
  };

  // --- Export Session ---
  const handleExportSession = () => {
    const activeSession = sessions.find((s) => s.id === activeSessionId);
    if (!activeSession || activeSession.messages.length === 0) return;

    let text = `# ${activeSession.title}\nExported: ${new Date().toLocaleString()}\n\n`;
    activeSession.messages.forEach((m) => {
      text += `### [${m.role.toUpperCase()}] - ${new Date(m.timestamp).toLocaleTimeString()}\n\n${m.content}\n\n`;
      if (m.sources && m.sources.length > 0) {
        text += `**Sources:**\n`;
        m.sources.forEach((s, idx) => {
          text += `- [${idx + 1}] ${s.title}: ${s.uri}\n`;
        });
        text += `\n`;
      }
      text += `---\n\n`;
    });

    const blob = new Blob([text], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${activeSession.title.replace(/\s+/g, "_")}_transcript.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Active Session info
  const activeSession = sessions.find((s) => s.id === activeSessionId) || {
    title: "New Conversation",
    messages: [],
  };

  const activePersona = SYSTEM_PERSONAS.find((p) => p.id === selectedPersonaId) || SYSTEM_PERSONAS[0];

  return (
    <div className="flex h-screen w-full bg-slate-950 font-sans text-slate-100 antialiased overflow-hidden">
      {/* --- SIDEBAR - Desktop --- */}
      <aside className="hidden lg:flex flex-col w-80 bg-slate-900 border-r border-slate-800 shrink-0 h-full">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg shadow-md shadow-indigo-900/40">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-wide text-white uppercase font-display">
                Vertex AI
              </h1>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Gemini 3.5 Engine
              </p>
            </div>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={createNewSession}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-sm font-medium text-white transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            <Plus size={16} />
            <span>New Session</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <div className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            History
          </div>
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <button
                key={session.id}
                onClick={() => handleSelectSession(session.id)}
                className={`w-full group flex items-center justify-between p-2.5 rounded-md text-left text-xs transition-all cursor-pointer ${
                  isActive
                    ? "bg-slate-800 text-white font-medium border-l-2 border-indigo-500"
                    : "text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare
                    size={14}
                    className={isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-400"}
                  />
                  <span className="truncate pr-1">{session.title}</span>
                </div>
                <button
                  onClick={(e) => deleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-700/80 text-slate-500 hover:text-rose-400 transition-all ml-1 cursor-pointer"
                  title="Delete chat session"
                >
                  <Trash2 size={12} />
                </button>
              </button>
            );
          })}
        </div>

        {/* Configuration Section */}
        <div className="p-4 border-t border-slate-800 space-y-4 bg-slate-900/60">
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Settings size={10} />
              <span>Persona Profile</span>
            </label>
            <div className="relative">
              <select
                value={selectedPersonaId}
                onChange={(e) =>
                  updateSessionConfig(e.target.value, webSearchEnabled, tempMode)
                }
                className="w-full bg-slate-850 border border-slate-750 rounded-lg py-1.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                {SYSTEM_PERSONAS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <ChevronRight size={12} className="rotate-90" />
              </div>
            </div>
            <p className="text-[11px] text-slate-450 italic leading-snug px-1">
              {activePersona.description}
            </p>
          </div>

          {/* Web Search Grounding Switch */}
          <div className="flex items-center justify-between p-2.5 bg-slate-850 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2">
              <Globe size={14} className={webSearchEnabled ? "text-indigo-400 animate-pulse" : "text-slate-400"} />
              <div>
                <div className="text-xs font-medium text-slate-200">Search Grounding</div>
                <div className="text-[10px] text-slate-500">Enable real-time Web data</div>
              </div>
            </div>
            <button
              onClick={() =>
                updateSessionConfig(selectedPersonaId, !webSearchEnabled, tempMode)
              }
              className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                webSearchEnabled ? "bg-indigo-600" : "bg-slate-700"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  webSearchEnabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Creativity Sliders */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-slate-500 uppercase font-semibold">
              <span>Tone Strategy</span>
              <span className="text-indigo-400 font-bold capitalize">{tempMode}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-slate-850 p-1 rounded-lg border border-slate-800 text-[10px]">
              {(["professional", "balanced", "creative"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => updateSessionConfig(selectedPersonaId, webSearchEnabled, mode)}
                  className={`py-1 rounded text-center font-medium capitalize transition-all cursor-pointer ${
                    tempMode === mode
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-450 hover:text-slate-200"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* --- MOBILE SIDEBAR DRAWER --- */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black"
            />

            {/* Content Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative flex flex-col w-72 bg-slate-900 border-r border-slate-800 h-full z-50"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-400" />
                  <span className="text-sm font-semibold tracking-wide text-white uppercase font-display">
                    Vertex AI
                  </span>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* New Chat Button */}
              <div className="p-3">
                <button
                  onClick={() => {
                    createNewSession();
                    setMobileSidebarOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white transition-all cursor-pointer"
                >
                  <Plus size={16} />
                  <span>New Session</span>
                </button>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto px-2 space-y-1">
                <div className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  History
                </div>
                {sessions.map((session) => {
                  const isActive = session.id === activeSessionId;
                  return (
                    <button
                      key={session.id}
                      onClick={() => handleSelectSession(session.id)}
                      className={`w-full group flex items-center justify-between p-2.5 rounded-md text-left text-xs transition-all cursor-pointer ${
                        isActive ? "bg-slate-800 text-white font-medium" : "text-slate-400"
                      }`}
                    >
                      <span className="truncate">{session.title}</span>
                      <button
                        onClick={(e) => deleteSession(session.id, e)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-all cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </button>
                  );
                })}
              </div>

              {/* Configuration Panel */}
              <div className="p-4 border-t border-slate-800 space-y-4 bg-slate-900/60">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Persona Profile
                  </label>
                  <select
                    value={selectedPersonaId}
                    onChange={(e) =>
                      updateSessionConfig(e.target.value, webSearchEnabled, tempMode)
                    }
                    className="w-full bg-slate-850 border border-slate-750 rounded-lg py-1.5 px-3 text-xs text-slate-200 focus:outline-none appearance-none cursor-pointer"
                  >
                    {SYSTEM_PERSONAS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between p-2 bg-slate-850 rounded-lg border border-slate-800">
                  <span className="text-xs font-medium text-slate-250">Search Grounding</span>
                  <button
                    onClick={() =>
                      updateSessionConfig(selectedPersonaId, !webSearchEnabled, tempMode)
                    }
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      webSearchEnabled ? "bg-indigo-600" : "bg-slate-700"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        webSearchEnabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-slate-500 uppercase font-semibold">
                    <span>Tone Strategy</span>
                    <span className="text-indigo-400">{tempMode}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 bg-slate-850 p-1 rounded-lg border border-slate-800 text-[10px]">
                    {(["professional", "balanced", "creative"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() =>
                          updateSessionConfig(selectedPersonaId, webSearchEnabled, mode)
                        }
                        className={`py-1 rounded text-center transition-all cursor-pointer ${
                          tempMode === mode ? "bg-indigo-600 text-white" : "text-slate-450"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MAIN WORKSPACE --- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
        {/* Workspace Header */}
        <header className="h-14 border-b border-slate-850 bg-slate-950/80 backdrop-blur px-4 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-400 cursor-pointer"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md font-display">
                  {activeSession.title}
                </h2>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 border border-slate-700/50 text-indigo-400 capitalize">
                  {activePersona.name}
                </span>
                {webSearchEnabled && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/40 border border-indigo-800/40 text-indigo-300">
                    <Globe size={8} />
                    <span>Live</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block">
                Session Engine ID: {activeSessionId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {activeSession.messages.length > 0 && (
              <>
                <button
                  onClick={handleExportSession}
                  className="flex items-center gap-1.5 text-xs py-1.5 px-2.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-350 hover:text-white transition-all cursor-pointer"
                  title="Export dialogue to Markdown"
                >
                  <FileDown size={14} />
                  <span className="hidden sm:inline">Export MD</span>
                </button>
                <button
                  onClick={clearCurrentChat}
                  className="flex items-center gap-1.5 text-xs py-1.5 px-2.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-350 hover:text-rose-400 transition-all cursor-pointer"
                  title="Clear messages in current session"
                >
                  <Trash2 size={14} />
                  <span className="hidden sm:inline">Clear Chat</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* Diagnostic Key Alert Banner */}
        {errorBanner && errorBanner.type === "API_KEY_MISSING" && (
          <div className="mx-4 mt-4 p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 shadow-md">
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-amber-900/50 text-amber-400 shrink-0 self-start">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-semibold text-white font-display">
                  Gemini API Key Required
                </h4>
                <p className="text-xs leading-relaxed text-slate-300">
                  {errorBanner.message}
                </p>
                <div className="pt-1 flex flex-wrap gap-2 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                    1. Open "Settings → Secrets"
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                    2. Add key "GEMINI_API_KEY"
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message Container Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-6">
          {activeSession.messages.length === 0 ? (
            /* --- EMPTY CHAT LANDING GRID --- */
            <div className="max-w-2xl mx-auto py-10 md:py-16 space-y-8">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center p-3 bg-indigo-950/50 border border-indigo-800/40 rounded-2xl mb-2 text-indigo-400 shadow-xl shadow-indigo-950/20">
                  <Sparkles size={32} className="animate-pulse" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white font-display">
                  Professional AI Workspace
                </h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Powered by <span className="text-indigo-400 font-semibold">Gemini 3.5 Flash</span>. Choose a specialized persona, toggle real-time Web grounding, and start building.
                </p>
              </div>

              {/* Quick Starter Grid */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <Compass size={12} />
                  <span>Interactive Quick Starters</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {QUICK_STARTERS.map((starter) => {
                    const IconComponent = starter.icon;
                    return (
                      <button
                        key={starter.id}
                        onClick={() =>
                          handleQuickStarterClick(starter.prompt, starter.personaId)
                        }
                        className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-850 hover:border-slate-750 bg-slate-900/30 hover:bg-slate-900/75 text-left transition-all hover:shadow-lg group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-slate-850 group-hover:bg-indigo-950 text-slate-400 group-hover:text-indigo-400 transition-colors shrink-0">
                          <IconComponent size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                            {starter.title}
                          </div>
                          <div className="text-[11px] text-slate-450 mt-1 line-clamp-2 leading-relaxed">
                            {starter.prompt}
                          </div>
                          <div className="text-[10px] text-indigo-500 font-medium mt-1.5">
                            {starter.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* --- CONVERSATION STREAM --- */
            <div className="max-w-3xl mx-auto space-y-6">
              {activeSession.messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {/* Bot avatar */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-lg bg-slate-850 border border-slate-750 flex items-center justify-center shrink-0 shadow-sm text-indigo-400">
                        {selectedPersonaId === "coder" ? (
                          <Code size={14} />
                        ) : selectedPersonaId === "writer" ? (
                          <PenTool size={14} />
                        ) : selectedPersonaId === "analyst" ? (
                          <BarChart3 size={14} />
                        ) : selectedPersonaId === "tutor" ? (
                          <BookOpen size={14} />
                        ) : (
                          <Sparkles size={14} />
                        )}
                      </div>
                    )}

                    {/* Chat Bubble content */}
                    <div className="max-w-[85%] space-y-1.5">
                      <div className="flex items-center gap-2 px-1 text-[10px] text-slate-500">
                        <span className="font-semibold tracking-wide uppercase">
                          {isUser ? "You" : activePersona.name}
                        </span>
                        <span>•</span>
                        <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div
                        className={`px-4 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed border ${
                          isUser
                            ? "bg-indigo-600/10 border-indigo-500/20 text-indigo-50 rounded-tr-none"
                            : "bg-slate-900/60 border-slate-800 text-slate-200 rounded-tl-none"
                        }`}
                      >
                        {isUser ? (
                          <div className="whitespace-pre-wrap">{m.content}</div>
                        ) : (
                          <MarkdownRenderer
                            content={m.content}
                            sources={m.sources}
                            onCitationClick={(src) => window.open(src.uri, "_blank", "noreferrer")}
                          />
                        )}

                        {/* Grounded Citation Source Panel */}
                        {m.sources && m.sources.length > 0 && (
                          <div className="mt-4 pt-3.5 border-t border-slate-800 space-y-2">
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                              <Globe size={10} className="animate-pulse" />
                              <span>Search grounding citations</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {m.sources.map((src, idx) => (
                                <a
                                  key={idx}
                                  href={src.uri}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-slate-850/80 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-350 hover:text-white transition-all max-w-[200px] truncate"
                                  title={src.title}
                                >
                                  <span className="font-bold text-indigo-400 text-[10px]">[{idx + 1}]</span>
                                  <span className="truncate">{src.title}</span>
                                  <ExternalLink size={9} className="text-slate-500 shrink-0" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing / Skeleton Loader */}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-slate-850 border border-slate-750 flex items-center justify-center shrink-0 shadow-sm text-indigo-400">
                    <Sparkles size={14} className="animate-pulse" />
                  </div>
                  <div className="max-w-[85%] space-y-1.5">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <span className="font-semibold tracking-wide uppercase">AI Engine</span>
                      <span>•</span>
                      <span>Reasoning...</span>
                    </div>
                    <div className="px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-2xl rounded-tl-none space-y-2 min-w-[200px]">
                      <div className="flex gap-1 items-center h-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </div>
                      <div className="h-2.5 bg-slate-800 rounded w-11/12 animate-pulse"></div>
                      <div className="h-2.5 bg-slate-800 rounded w-3/4 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar Section */}
        <div className="p-4 border-t border-slate-850 bg-slate-950 shrink-0">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-2 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all shadow-xl shadow-black/40"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  webSearchEnabled
                    ? `Ask ${activePersona.name} with Search enabled...`
                    : `Message ${activePersona.name}...`
                }
                disabled={isLoading}
                className="flex-1 bg-transparent border-none py-1.5 px-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-0"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-600 active:scale-95 transition-all cursor-pointer shrink-0"
                title="Send message"
              >
                <Send size={15} />
              </button>
            </form>

            <div className="flex items-center justify-between mt-2.5 px-1.5 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span>Model: <strong>gemini-3.5-flash</strong></span>
                <span>•</span>
                <span>Max tokens: auto</span>
              </div>
              <div className="flex items-center gap-1 text-slate-450 hover:text-slate-300 transition-colors">
                <HelpCircle size={10} />
                <span>Format support: markdown & code</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
