import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Camera, Upload, FileImage, RefreshCw, Check, Trash2, 
  Sparkles, AlertTriangle, Calendar, Clock, ListPlus, ArrowRight,
  Info, ShieldAlert, History, Activity, Play, CheckCircle
} from "lucide-react";
import { fetchWithAuth } from "../App";

interface TaskInput {
  title: string;
  dueDate: string;
  time: string;
  priority: "low" | "medium" | "high" | "critical";
  description: string;
}

interface AISuggestions {
  recommendedSchedule: string;
  conflicts: string;
  deepWorkSessions: string;
  timeEstimation: string;
  priorityOrder: string;
}

interface ScanHistoryItem {
  id?: string;
  _id?: string;
  originalImage: string;
  ocrText: string;
  aiOutput: string;
  createdTasksCount: number;
  createdAt: string;
}

interface AIScheduleScannerProps {
  onRefreshTasks: () => void;
}

export default function AIScheduleScanner({ onRefreshTasks }: AIScheduleScannerProps) {
  // Navigation & Workflow states
  // "upload" | "ocr_review" | "ai_parsing" | "preview_import" | "success"
  const [step, setStep] = useState<"upload" | "ocr_review" | "ai_parsing" | "preview_import" | "success">("upload");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Scan & Processing state
  const [scanId, setScanId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rawOcrText, setRawOcrText] = useState<string>("");
  const [tasks, setTasks] = useState<TaskInput[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestions | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);

  // Camera integration
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Load history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetchWithAuth("/api/scanner/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to load scan history:", err);
    }
  };

  // Turn on device camera
  const startCamera = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraStream(stream);
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setErrorMessage("Could not access your device camera. Please check camera permissions or upload an image file instead.");
    }
  };

  // Freeze video frame and capture photo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setImagePreview(dataUrl);
        stopCamera();
        uploadAndRunOcr(dataUrl);
      }
    }
  };

  // Close device camera stream
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (PNG, JPG, JPEG, WEBP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImagePreview(reader.result);
        uploadAndRunOcr(reader.result);
      }
    };
    reader.onerror = () => {
      setErrorMessage("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Send image to /api/scanner/upload (Gemini Vision OCR Step)
  const uploadAndRunOcr = async (base64Image: string) => {
    setLoading(true);
    setErrorMessage(null);
    setStep("ocr_review");
    
    try {
      const res = await fetchWithAuth("/api/scanner/upload", {
        method: "POST",
        body: JSON.stringify({ image: base64Image })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to analyze image schedule.");
      }

      const data = await res.json();
      setScanId(data.id);
      setRawOcrText(data.ocrText);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An error occurred during text extraction. Please try again.");
      setStep("upload");
    } finally {
      setLoading(false);
    }
  };

  // Run Gemini analysis on raw text to structure it
  const triggerAiProcess = async () => {
    setLoading(true);
    setErrorMessage(null);
    setStep("ai_parsing");

    try {
      const res = await fetchWithAuth("/api/scanner/process", {
        method: "POST",
        body: JSON.stringify({ 
          rawText: rawOcrText,
          id: scanId 
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gemini was unable to structure the raw text.");
      }

      const data = await res.json();
      setTasks(data.tasks || []);
      setSuggestions(data.suggestions || null);
      setStep("preview_import");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to analyze text structure. Try simplifying or cleaning your notes.");
      setStep("ocr_review");
    } finally {
      setLoading(false);
    }
  };

  // Submit approved tasks to create them in database
  const saveScannedTasks = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetchWithAuth("/api/scanner/create-tasks", {
        method: "POST",
        body: JSON.stringify({
          id: scanId,
          tasks: tasks
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save scanned tasks.");
      }

      setStep("success");
      onRefreshTasks();
      fetchHistory();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to create scanned tasks.");
    } finally {
      setLoading(false);
    }
  };

  // Delete historical scan entry
  const deleteHistoryItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetchWithAuth(`/api/scanner/history/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchHistory();
      }
    } catch (err) {
      console.error("Failed to delete history item:", err);
    }
  };

  // Load old scan from history
  const loadHistoryItem = (item: ScanHistoryItem) => {
    setErrorMessage(null);
    setScanId(item.id || item._id || null);
    setImagePreview(item.originalImage);
    setRawOcrText(item.ocrText);
    
    if (item.aiOutput && item.aiOutput !== "[]") {
      try {
        const parsed = JSON.parse(item.aiOutput);
        setTasks(parsed.tasks || []);
        setSuggestions(parsed.suggestions || null);
        setStep("preview_import");
      } catch (err) {
        setStep("ocr_review");
      }
    } else {
      setStep("ocr_review");
    }
  };

  // Edit fields inside state table
  const updateTaskField = (index: number, field: keyof TaskInput, value: string) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
  };

  // Add empty manual task row
  const addEmptyTaskRow = () => {
    const newTask: TaskInput = {
      title: "New Task",
      dueDate: "2026-06-28",
      time: "12:00 PM",
      priority: "medium",
      description: "Added during planner scan review."
    };
    setTasks([...tasks, newTask]);
  };

  // Remove task row
  const removeTaskRow = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  // Reset to initial scan screen
  const handleRetry = () => {
    setImagePreview(null);
    setRawOcrText("");
    setTasks([]);
    setSuggestions(null);
    setScanId(null);
    setStep("upload");
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Camera className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-display font-semibold text-white">AI Schedule Scanner</h2>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Upload a photo of your notebook page, printed planner, whiteboard, sticky notes, or timetable. 
            The system extracts the handwriting/printed text using multimodal Gemini Vision and converts it into fully scheduled interactive digital tasks.
          </p>
        </div>
        {step !== "upload" && (
          <button
            onClick={handleRetry}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-300 transition-all cursor-pointer self-start md:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Scan New Image
          </button>
        )}
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold">Operation Alert</span>
            <p className="leading-relaxed opacity-90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Primary Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Flow View */}
        <div className="lg:col-span-8 space-y-6">

          {/* STEP 1: UPLOAD & ACQUIRE SOURCE */}
          {step === "upload" && (
            <div className="space-y-6">
              {/* Drag and drop panel */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`glass-panel p-10 rounded-2xl border-2 border-dashed transition-all duration-200 text-center flex flex-col items-center justify-center min-h-[340px] relative overflow-hidden ${
                  isDragging 
                    ? "border-violet-500 bg-violet-500/5 shadow-[0_0_15px_rgba(139,92,246,0.1)]" 
                    : "border-zinc-800 hover:border-zinc-700 bg-zinc-950"
                }`}
              >
                {/* Visual Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-violet-500/10 blur-[100px] pointer-events-none" />

                <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 mb-4 shadow-inner">
                  <Upload className="w-8 h-8" />
                </div>

                <h3 className="text-sm font-semibold text-white mb-2">Drag and drop your schedule photo here</h3>
                <p className="text-xs text-zinc-500 max-w-sm leading-relaxed mb-6">
                  Supports handwritten notebook pages, whiteboard plans, printed sticky notes, JPG, PNG, WEBP.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  {/* File Selection Trigger */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/15 transition-all cursor-pointer"
                  >
                    <FileImage className="w-3.5 h-3.5" />
                    Browse Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* Camera Toggle Trigger */}
                  <button
                    onClick={startCamera}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-300 transition-all cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Use Device Camera
                  </button>
                </div>
              </div>

              {/* CAMERA ACTIVE CONTAINER */}
              {isCameraActive && (
                <div className="glass-panel p-4 rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden relative">
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-900">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-mono text-zinc-300">Live Device Camera Feed</span>
                    </div>
                    <button
                      onClick={stopCamera}
                      className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      Cancel Stream
                    </button>
                  </div>

                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-zinc-800">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    <div className="absolute inset-0 border border-white/10 pointer-events-none rounded-xl" />
                    <div className="absolute inset-10 border border-dashed border-white/20 pointer-events-none rounded-lg flex items-center justify-center">
                      <div className="text-[10px] font-mono text-white/40 bg-zinc-950/60 px-2 py-1 rounded">
                        Position Document inside target
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={capturePhoto}
                      className="flex items-center gap-2 px-5 py-3 rounded-full text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/15 transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Camera className="w-4 h-4" />
                      Capture Schedule
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: OCR TEXT EXTRACTION & VERIFICATION */}
          {step === "ocr_review" && (
            <div className="glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Step 1: Extracted Text Review</h3>
                  <p className="text-[10px] text-zinc-500">Gemini Vision OCR extraction complete. Refine details below if needed.</p>
                </div>
                {loading && (
                  <div className="flex items-center gap-2">
                    <div className="w-4.5 h-4.5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                    <span className="text-[10px] font-mono text-zinc-400">Extracting text...</span>
                  </div>
                )}
              </div>

              {/* Source preview thumbnail */}
              {imagePreview && (
                <div className="relative h-28 w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                  <img
                    src={imagePreview}
                    alt="Scan Source"
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900/80 border border-zinc-800 text-zinc-400">
                      Document Source Loaded
                    </span>
                  </div>
                </div>
              )}

              {/* Editable Text Area */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">RAW EXTRACTED OCR WORKSPACE</label>
                <textarea
                  value={rawOcrText}
                  onChange={(e) => setRawOcrText(e.target.value)}
                  disabled={loading}
                  rows={8}
                  className="w-full p-4 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-mono text-zinc-200 focus:outline-none focus:border-violet-500/50 resize-y leading-relaxed disabled:opacity-50"
                  placeholder="Raw extracted text will appear here. You can manually enter or clean up notes..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-900">
                <button
                  onClick={handleRetry}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-zinc-400 transition-all cursor-pointer disabled:opacity-50"
                >
                  Discard Scan
                </button>
                <button
                  onClick={triggerAiProcess}
                  disabled={loading || !rawOcrText.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/15 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Parsing text..." : "Convert Extracted Text with Gemini"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DYNAMIC AI PARSING LOADER */}
          {step === "ai_parsing" && (
            <div className="glass-panel p-12 rounded-2xl border border-zinc-800 bg-zinc-950 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-violet-500/10 border-t-violet-500 animate-spin" />
                <div className="absolute inset-2 rounded-full border-4 border-indigo-500/20 border-b-indigo-400 animate-spin animate-duration-1000" />
                <div className="absolute inset-4 flex items-center justify-center text-violet-400">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">Gemini AI Structuring Workload...</h3>
              <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
                Analyzing handwriting semantics, identifying deadlines, predicting task urgency, and generating strategic schedule advice. Please wait...
              </p>
            </div>
          )}

          {/* STEP 4: VERIFICATION PREVIEW TABLE & SAVE */}
          {step === "preview_import" && (
            <div className="space-y-6">
              
              {/* Main table view */}
              <div className="glass-panel p-5 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-900">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Step 2: Scanned Actionable Tasks</h3>
                    <p className="text-[10px] text-zinc-500">Edit or delete extracted tasks before saving to your profile dashboard.</p>
                  </div>
                  <button
                    onClick={addEmptyTaskRow}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer"
                  >
                    <ListPlus className="w-3.5 h-3.5 text-zinc-400" />
                    Add Custom Task Row
                  </button>
                </div>

                {/* Table list */}
                {tasks.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-xs">
                    No tasks detected. Try clicking 'Add Custom Task Row' or scanning again.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-900 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                          <th className="py-2.5 px-2">Task Title</th>
                          <th className="py-2.5 px-2 w-36">Due Date</th>
                          <th className="py-2.5 px-2 w-28">Time</th>
                          <th className="py-2.5 px-2 w-28">Urgency</th>
                          <th className="py-2.5 px-2 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900/60">
                        {tasks.map((task, i) => (
                          <tr key={i} className="hover:bg-zinc-900/20 group">
                            {/* Title */}
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={task.title}
                                onChange={(e) => updateTaskField(i, "title", e.target.value)}
                                className="w-full px-2 py-1.5 rounded border border-transparent hover:border-zinc-800 focus:border-zinc-700 bg-transparent text-xs text-white focus:outline-none transition-all font-medium"
                              />
                            </td>
                            {/* Due Date */}
                            <td className="py-2 px-2">
                              <input
                                type="date"
                                value={task.dueDate}
                                onChange={(e) => updateTaskField(i, "dueDate", e.target.value)}
                                className="w-full px-2 py-1.5 rounded border border-transparent hover:border-zinc-800 focus:border-zinc-700 bg-transparent text-xs text-zinc-300 focus:outline-none transition-all font-mono"
                              />
                            </td>
                            {/* Time */}
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={task.time}
                                onChange={(e) => updateTaskField(i, "time", e.target.value)}
                                placeholder="e.g. 7:00 PM"
                                className="w-full px-2 py-1.5 rounded border border-transparent hover:border-zinc-800 focus:border-zinc-700 bg-transparent text-xs text-zinc-300 focus:outline-none transition-all font-mono"
                              />
                            </td>
                            {/* Urgency */}
                            <td className="py-2 px-2">
                              <select
                                value={task.priority}
                                onChange={(e) => updateTaskField(i, "priority", e.target.value as any)}
                                className="w-full px-1.5 py-1.5 rounded border border-transparent hover:border-zinc-800 focus:border-zinc-700 bg-transparent text-xs focus:outline-none transition-all text-zinc-300 font-mono"
                              >
                                <option value="low" className="bg-zinc-950 text-zinc-300">Low</option>
                                <option value="medium" className="bg-zinc-950 text-zinc-300">Medium</option>
                                <option value="high" className="bg-zinc-950 text-zinc-300">High</option>
                                <option value="critical" className="bg-zinc-950 text-zinc-300">Critical</option>
                              </select>
                            </td>
                            {/* Delete Button */}
                            <td className="py-2 px-2 text-center">
                              <button
                                onClick={() => removeTaskRow(i)}
                                className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer opacity-0 group-hover:opacity-100 transition-all"
                                aria-label="Delete Task Row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Confirm Action Bar */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-900 mt-2">
                  <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Tasks with times will auto-block on your Calendar grid.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setStep("ocr_review")}
                      className="px-4 py-2 rounded-xl text-xs font-medium border border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-zinc-400 transition-all cursor-pointer"
                    >
                      Refine OCR
                    </button>
                    <button
                      onClick={saveScannedTasks}
                      disabled={loading || tasks.length === 0}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/15 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {loading ? "Importing tasks..." : "Import Approved Tasks & Sync Calendar"}
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Recommendations Sidebar/Block */}
              {suggestions && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Recommended Pacing */}
                  <div className="glass-panel p-5 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-900">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                      <h4 className="text-xs font-mono uppercase tracking-wider text-white">AI Recommended Schedule</h4>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">
                      {suggestions.recommendedSchedule}
                    </p>
                  </div>

                  {/* Smart Diagnostics (Conflicts & Estimations) */}
                  <div className="glass-panel p-5 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-900">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-mono uppercase tracking-wider text-white">AI Schedule Diagnostics</h4>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-mono text-zinc-500 block uppercase">Workload Estimate</span>
                        <p className="text-xs text-zinc-200 mt-0.5">{suggestions.timeEstimation}</p>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-zinc-500 block uppercase">Conflict Warnings</span>
                        <p className="text-xs text-zinc-200 mt-0.5">{suggestions.conflicts}</p>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-zinc-500 block uppercase">Suggested Deep Work Hours</span>
                        <p className="text-xs text-zinc-200 mt-0.5">{suggestions.deepWorkSessions}</p>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-zinc-500 block uppercase">Optimized Sequence Order</span>
                        <p className="text-xs text-zinc-200 mt-0.5">{suggestions.priorityOrder}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: SUCCESS PORTAL */}
          {step === "success" && (
            <div className="glass-panel p-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center flex flex-col items-center justify-center min-h-[340px]">
              <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 animate-bounce">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">Schedule Imported Successfully</h3>
              <p className="text-xs text-zinc-400 max-w-sm leading-relaxed mb-6">
                Your parsed task list has been integrated into your core checklist, corresponding hourly slots have been blocked on your Calendar, and notifications are primed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Scan Another Document
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Scan History & Context */}
        <div className="lg:col-span-4 space-y-6">

          {/* Guidelines Box */}
          <div className="glass-panel p-5 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-white">Scanner Quick Guide</h4>
            <div className="space-y-2 text-xs text-zinc-400 leading-relaxed">
              <p>📸 <strong className="text-zinc-200">Tips for capture:</strong> Ensure document lighting is uniform, the handwriting is legible, and the paper is aligned straight inside your camera viewport.</p>
              <p>🗓️ <strong className="text-zinc-200">Recognized phrases:</strong> Expressive schedules like <code className="text-violet-400 font-mono px-1 rounded bg-zinc-900">tomorrow 8PM</code>, <code className="text-violet-400 font-mono px-1 rounded bg-zinc-900">next Friday midterm</code>, or <code className="text-violet-400 font-mono px-1 rounded bg-zinc-900">Monday assignment</code> are parsed into absolute calendar coordinates automatically.</p>
            </div>
          </div>

          {/* Historical Scans List */}
          <div className="glass-panel p-5 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
              <div className="flex items-center gap-2 text-zinc-300">
                <History className="w-4 h-4 text-zinc-400" />
                <h4 className="text-xs font-mono uppercase tracking-wider font-semibold">Recent Scanner History</h4>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">
                {history.length}
              </span>
            </div>

            {history.length === 0 ? (
              <p className="text-center text-zinc-600 text-xs py-6 font-sans">
                Your past scanned timetables will appear here.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto scrollbar-thin">
                {history.map((item) => (
                  <div
                    key={item.id || item._id}
                    onClick={() => loadHistoryItem(item)}
                    className="p-3 rounded-xl border border-zinc-900 bg-zinc-950/60 hover:bg-zinc-900/40 hover:border-zinc-800 transition-all cursor-pointer group flex items-start justify-between gap-3 relative overflow-hidden"
                  >
                    {/* Tiny visual line */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-600/30 group-hover:bg-violet-600/60 transition-all" />

                    <div className="space-y-1 pl-2">
                      <div className="text-[10px] font-mono text-zinc-500">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recent Scan"}
                      </div>
                      <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed font-mono">
                        {item.ocrText}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-violet-500/10 border border-violet-500/20 text-violet-400">
                          {item.createdTasksCount || 0} tasks imported
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => deleteHistoryItem(e, item.id || item._id || "")}
                      className="p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                      aria-label="Delete history scan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Hidden container for camera snapshot capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
