import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX, Sparkles, AlertCircle, Play, CheckCircle2, ListTodo, BrainCircuit } from "lucide-react";
import { Task } from "../types";

interface VoiceAssistantProps {
  tasks: Task[];
  onAddTask: (title: string, urgency: "low" | "medium" | "high" | "critical", dueDate: string) => Promise<void>;
  onRefreshTasks: () => void;
  runLifeOSEngine: () => Promise<void>;
}

export default function VoiceAssistant({ tasks, onAddTask, onRefreshTasks, runLifeOSEngine }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [statusText, setStatusText] = useState("Idle. Click the microphone to start.");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceLogs, setVoiceLogs] = useState<{ id: string; sender: "user" | "assistant"; text: string; timestamp: string }[]>([
    {
      id: "init",
      sender: "assistant",
      text: "Voice assistant active. Try saying: 'Add task review electrochemistry' or 'Read my tasks'.",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setStatusText("Speech recognition is not fully supported in this browser. Running in text-fallback simulator mode.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setStatusText("Listening for command...");
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setTranscript(speechToText);
      handleCommand(speechToText);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        setStatusText("Microphone permission denied. Please enable mic access.");
      } else {
        setStatusText(`Error: ${event.error}. Click to retry.`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const speak = (text: string) => {
    if (!voiceEnabled) return;
    try {
      window.speechSynthesis.cancel(); // Stop any active speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      // Prefer a high-quality natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Natural") || v.lang.startsWith("en"));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Speech synthesis failed:", err);
    }
  };

  const addLog = (sender: "user" | "assistant", text: string) => {
    setVoiceLogs(prev => [
      {
        id: Date.now().toString(),
        sender,
        text,
        timestamp: new Date().toLocaleTimeString()
      },
      ...prev
    ]);
  };

  const handleCommand = async (command: string) => {
    const cleanCmd = command.toLowerCase().trim();
    addLog("user", command);

    // 1. Add Task Command: "add task [title]" or "create task [title]"
    if (cleanCmd.startsWith("add task ") || cleanCmd.startsWith("create task ")) {
      const taskTitle = command.replace(/^(add task |create task )/i, "").trim();
      if (!taskTitle) {
        const reply = "Could not hear the task title. Try saying: 'Add task review notes'.";
        addLog("assistant", reply);
        speak(reply);
        setStatusText("Task title empty.");
        return;
      }

      setStatusText(`Adding task: "${taskTitle}"...`);
      try {
        await onAddTask(taskTitle, "medium", "2026-06-29");
        const reply = `Task added successfully: ${taskTitle}.`;
        addLog("assistant", reply);
        speak(reply);
        setStatusText(`Task added: "${taskTitle}"`);
      } catch (err) {
        const reply = "Failed to save the task. Please try again.";
        addLog("assistant", reply);
        speak(reply);
        setStatusText("Failed to create task.");
      }
    } 
    // 2. Read Tasks: "read my tasks", "list tasks", "what are my tasks"
    else if (cleanCmd.includes("read") && (cleanCmd.includes("task") || cleanCmd.includes("commitment"))) {
      setStatusText("Reading active tasks...");
      const pendingTasks = tasks.filter(t => t.status !== "completed");
      if (pendingTasks.length === 0) {
        const reply = "You have no pending tasks. Great job!";
        addLog("assistant", reply);
        speak(reply);
      } else {
        const listText = pendingTasks.slice(0, 4).map(t => t.title).join(". And, ");
        const countReply = `You have ${pendingTasks.length} pending tasks. Here are the top items: ${listText}.`;
        addLog("assistant", countReply);
        speak(countReply);
      }
      setStatusText("Tasks read.");
    } 
    // 3. Synchronize LifeOS: "synchronize", "sync life os", "align agents"
    else if (cleanCmd.includes("sync") || cleanCmd.includes("align") || cleanCmd.includes("process")) {
      setStatusText("Syncing data...");
      const reply = "Syncing tasks and optimizing your schedule...";
      addLog("assistant", reply);
      speak(reply);
      try {
        await runLifeOSEngine();
        const successReply = "Sync complete! Your schedule has been updated.";
        addLog("assistant", successReply);
        speak(successReply);
        setStatusText("Sync complete.");
      } catch (e) {
        const errReply = "Sync failed. Please check your connection.";
        addLog("assistant", errReply);
        speak(errReply);
        setStatusText("Sync failed.");
      }
    } 
    // 4. Default: Let Gemini handle or mock assistant response
    else {
      const reply = `I heard you say: "${command}". You can add tasks, list tasks, or sync. Try saying: 'Add task read chemistry textbook'.`;
      addLog("assistant", reply);
      speak(reply);
      setStatusText("Command recognized.");
    }
  };

  const toggleListening = () => {
    if (!speechSupported) {
      // Simulate input prompt for browsers without speech support
      const simulatedCmd = prompt("Speech API is not active in this browser frame. Type a command to simulate voice input:", "add task Read Chemistry Chapter 4");
      if (simulatedCmd) {
        handleCommand(simulatedCmd);
      }
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript("");
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Failed to start speech recognition:", e);
      }
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-zinc-800 space-y-5">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4.5 h-4.5 text-white animate-pulse" />
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">AI Voice Assistant</h3>
            <p className="text-[10px] text-zinc-500 font-mono">VOICE COMMANDS</p>
          </div>
        </div>
        
        <button
          onClick={() => {
            const next = !voiceEnabled;
            setVoiceEnabled(next);
            if (!next) window.speechSynthesis.cancel();
          }}
          className={`px-2.5 py-1 rounded border text-[9px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
            voiceEnabled 
              ? "bg-zinc-900 border-zinc-800 text-emerald-400 hover:border-zinc-700" 
              : "bg-zinc-950 border-zinc-900 text-zinc-600 hover:border-zinc-850"
          }`}
          title={voiceEnabled ? "Mute TTS response" : "Unmute TTS response"}
        >
          {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          {voiceEnabled ? "VOICE OUTPUT ON" : "VOICE OUTPUT MUTED"}
        </button>
      </div>

      {/* Main Mic trigger visual stage */}
      <div className="flex flex-col items-center justify-center py-6 bg-zinc-950/40 border border-zinc-900 rounded-xl space-y-4 relative overflow-hidden">
        
        {/* Animated ambient waveform background */}
        {isListening && (
          <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-20 pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <span 
                key={i} 
                className="w-1 bg-white rounded-full animate-pulse" 
                style={{ 
                  height: `${Math.random() * 80 + 20}%`, 
                  animationDelay: `${i * 100}ms`,
                  animationDuration: '600ms'
                }} 
              />
            ))}
          </div>
        )}

        {/* Glow effect */}
        <div className={`absolute w-32 h-32 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
          isListening ? "bg-red-500/10 scale-125" : "bg-white/[0.01]"
        }`} />

        <button
          onClick={toggleListening}
          className={`w-16 h-16 rounded-full flex items-center justify-center border transition-all duration-300 relative cursor-pointer group ${
            isListening 
              ? "bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20 scale-105" 
              : "bg-zinc-900 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white"
          }`}
        >
          {isListening ? (
            <Mic className="w-6 h-6 animate-ping absolute" />
          ) : null}
          {isListening ? (
            <Mic className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6 group-hover:scale-105 transition-transform" />
          )}
        </button>

        <div className="text-center space-y-1 z-10 px-4">
          <p className="text-xs font-semibold text-white">
            {isListening ? "Listening..." : "Inactive"}
          </p>
          <p className="text-[10px] text-zinc-500 font-mono tracking-tight max-w-sm mx-auto leading-relaxed">
            {statusText}
          </p>
        </div>

        {/* Live spoken feedback text bar */}
        {transcript && (
          <div className="mt-2 bg-zinc-900/60 border border-zinc-850 rounded-lg px-3 py-1.5 max-w-xs text-center">
            <span className="text-[9px] font-mono text-zinc-500 block uppercase mb-0.5">LATEST TRANSCRIPT</span>
            <p className="text-xs text-zinc-300 italic font-medium">"{transcript}"</p>
          </div>
        )}
      </div>

      {/* Grid mapping out supported voice actions */}
      <div className="p-3.5 bg-white/[0.01] border border-zinc-900 rounded-xl space-y-2">
        <span className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">Supported Commands</span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-zinc-500 font-sans">
          <div className="flex items-start gap-1.5">
            <span className="text-white font-mono font-bold">•</span>
            <span>Say <strong className="text-zinc-300">"Add task [Name]"</strong> to add a task instantly.</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-white font-mono font-bold">•</span>
            <span>Say <strong className="text-zinc-300">"Read tasks"</strong> to listen to your pending tasks.</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-white font-mono font-bold">•</span>
            <span>Say <strong className="text-zinc-300">"Sync tasks"</strong> to optimize your schedule.</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-white font-mono font-bold">•</span>
            <span>Or use the fallback input popup to simulate command testing.</span>
          </div>
        </div>
      </div>

      {/* Voice Assistant interaction Logs/History */}
      <div className="space-y-2.5">
        <span className="text-[10px] font-mono text-zinc-400 block uppercase tracking-wider">Voice History</span>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {voiceLogs.map((log) => (
            <div 
              key={log.id} 
              className={`p-2.5 rounded-lg border ${
                log.sender === "user" 
                  ? "bg-zinc-950/60 border-zinc-900/50 text-right ml-8" 
                  : "bg-white/[0.01] border-zinc-850/30 text-left mr-8"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1 text-[8px] font-mono text-zinc-500">
                <span className="uppercase">{log.sender === "user" ? "User" : "Assistant"}</span>
                <span>{log.timestamp}</span>
              </div>
              <p className="text-xs text-zinc-300 font-sans leading-relaxed">{log.text}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
