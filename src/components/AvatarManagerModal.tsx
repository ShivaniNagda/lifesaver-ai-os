import React, { useState, useRef, useEffect } from "react";
import { Camera, X, RefreshCw, ZoomIn, RotateCw, Trash2, Image as ImageIcon, AlertCircle } from "lucide-react";
import { useToast } from "./ToastProvider";

interface AvatarManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string;
  onAvatarUpdated: (newUrl: string) => void;
}

const DEFAULT_AVATAR = "https://ui-avatars.com/api/?name=User&background=random";

export default function AvatarManagerModal({
  isOpen,
  onClose,
  currentAvatar,
  onAvatarUpdated,
}: AvatarManagerModalProps) {
  const { success: showSuccess, error: showError } = useToast();
  
  const [step, setStep] = useState<"menu" | "preview" | "loading">("menu");
  const [loadingText, setLoadingText] = useState("Uploading...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Preview adjustments
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getHeaders = () => {
    const token = localStorage.getItem("lifeos_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);

    // Validate type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Unsupported format: Only JPG, JPEG, PNG, and WEBP formats are supported.");
      showError("Unsupported Format", "Please select a JPG, JPEG, PNG, or WEBP image file.");
      return;
    }

    // Validate size (5 MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMsg("Large file: The chosen profile image exceeds the 5 MB maximum size limit.");
      showError("File Too Large", "Profile picture must be smaller than 5 MB.");
      return;
    }

    // Read file as base64 for preview and corruption check
    const reader = new FileReader();
    reader.onloadstart = () => {
      setStep("loading");
      setLoadingText("Image Processing...");
    };
    
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      
      // Corruption check via loading into an Image object
      const img = new Image();
      img.onload = () => {
        setFilePreview(dataUrl);
        setZoom(1);
        setRotation(0);
        setStep("preview");
      };
      img.onerror = () => {
        setStep("menu");
        setErrorMsg("Corrupted image: The selected file could not be read correctly.");
        showError("Invalid Image", "This image appears to be corrupted or invalid.");
      };
      img.src = dataUrl;
    };

    reader.onerror = () => {
      setStep("menu");
      setErrorMsg("Upload failed: Unable to read file.");
      showError("Upload Failed", "An error occurred while reading the image file.");
    };

    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!filePreview) return;

    setStep("loading");
    setLoadingText("Saving...");

    try {
      // Process image onto a canvas to apply Rotate, Zoom, and Crop to exactly 250x250
      const imgElement = new Image();
      imgElement.onload = async () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            throw new Error("Unable to create canvas context");
          }

          const size = 250;
          canvas.width = size;
          canvas.height = size;

          // Clear canvas
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, size, size);

          // Apply rotation and scaling around center
          ctx.translate(size / 2, size / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.scale(zoom, zoom);

          // Draw the image centered
          const ratio = Math.max(size / imgElement.width, size / imgElement.height);
          const drawWidth = imgElement.width * ratio;
          const drawHeight = imgElement.height * ratio;

          ctx.drawImage(
            imgElement,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight
          );

          // Export as compressed jpeg base64
          const processedBase64 = canvas.toDataURL("image/jpeg", 0.9);

          // Upload to API
          const res = await fetch("/api/profile/avatar", {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ image: processedBase64 }),
          });

          const data = await res.json();
          if (res.ok) {
            onAvatarUpdated(data.profileImage);
            showSuccess("Success", "Profile picture updated successfully.");
            handleClose();
          } else {
            throw new Error(data.error || "Failed to save profile picture.");
          }
        } catch (err: any) {
          setStep("preview");
          setErrorMsg(err.message || "Upload failed.");
          showError("Upload Failed", err.message || "An error occurred while uploading your avatar.");
        }
      };

      imgElement.onerror = () => {
        setStep("preview");
        setErrorMsg("Failed to process image.");
        showError("Processing Error", "Failed to load image canvas properties.");
      };

      imgElement.src = filePreview;
    } catch (err: any) {
      setStep("preview");
      setErrorMsg(err.message || "Image manipulation failed.");
    }
  };

  const handleRemovePhoto = async () => {
    setStep("loading");
    setLoadingText("Saving...");
    try {
      const res = await fetch("/api/profile/avatar", {
        method: "DELETE",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        onAvatarUpdated("");
        showSuccess("Success", "Profile picture removed.");
        handleClose();
      } else {
        throw new Error(data.error || "Failed to remove avatar.");
      }
    } catch (err: any) {
      setStep("menu");
      setErrorMsg(err.message);
      showError("Removal Failed", err.message);
    }
  };

  const handleResetToDefault = async () => {
    setStep("loading");
    setLoadingText("Saving...");
    try {
      // First clear the saved avatar from database so it falls back to default
      const res = await fetch("/api/profile/avatar", {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (res.ok) {
        onAvatarUpdated("");
        showSuccess("Success", "Reset to default avatar completed.");
        handleClose();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to reset avatar.");
      }
    } catch (err: any) {
      setStep("menu");
      setErrorMsg(err.message);
      showError("Reset Failed", err.message);
    }
  };

  const handleClose = () => {
    setStep("menu");
    setFilePreview(null);
    setZoom(1);
    setRotation(0);
    setErrorMsg(null);
    onClose();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Back from preview to menu
  const handleBackToMenu = () => {
    setStep("menu");
    setFilePreview(null);
    setErrorMsg(null);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-modal-title"
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          handleClose();
        }
      }}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-900 shadow-2xl text-zinc-200 transition-all duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900">
          <h3 id="avatar-modal-title" className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
            {step === "preview" ? "Adjust Picture" : "Manage Profile Image"}
          </h3>
          <button 
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-zinc-900 transition-colors text-zinc-400 hover:text-white focus:outline-none focus:ring-1 focus:ring-zinc-700"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6">
          
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-red-950/40 border border-red-900/60 text-red-400 text-xs font-mono">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === "menu" && (
            <div className="space-y-4">
              
              {/* Current Avatar View */}
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative w-24 h-24 rounded-full border-2 border-zinc-800 overflow-hidden bg-black/40 mb-2">
                  <img 
                    src={currentAvatar || DEFAULT_AVATAR} 
                    alt="Current profile picture"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {currentAvatar ? "Custom Avatar Active" : "Default System Avatar"}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                  id="avatar-file-input"
                />

                <button
                  onClick={triggerFileInput}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-all border border-zinc-800 hover:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  id="btn-upload-photo"
                >
                  <ImageIcon className="w-4 h-4" />
                  {currentAvatar ? "Change Photo" : "Upload Photo"}
                </button>

                {currentAvatar && (
                  <button
                    onClick={handleRemovePhoto}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 font-semibold text-xs transition-all border border-red-950/50 hover:border-red-900/50 focus:outline-none focus:ring-1 focus:ring-red-500"
                    id="btn-remove-photo"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove Photo
                  </button>
                )}

                {currentAvatar && (
                  <button
                    onClick={handleResetToDefault}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 font-medium text-xs transition-all border border-zinc-900 hover:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                    id="btn-default-photo"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset to Default Avatar
                  </button>
                )}
              </div>
            </div>
          )}

          {step === "preview" && filePreview && (
            <div className="space-y-5">
              
              {/* Circular preview area */}
              <div className="flex justify-center">
                <div className="relative w-44 h-44 rounded-full border-2 border-emerald-500 overflow-hidden bg-black shadow-inner">
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      transition: "transform 0.1s ease-out"
                    }}
                  >
                    <img 
                      src={filePreview} 
                      alt="Crop and Rotate Preview" 
                      className="max-w-none w-full h-full object-cover"
                      style={{
                        transform: `scale(${zoom})`,
                        transition: "transform 0.1s ease-out"
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Adjustments Controls */}
              <div className="space-y-4 bg-black/40 border border-zinc-900 rounded-xl p-4">
                
                {/* Zoom control */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span className="flex items-center gap-1"><ZoomIn className="w-3.5 h-3.5" /> ZOOM (SCALE)</span>
                    <span>{Math.round(zoom * 100)}%</span>
                  </div>
                  <input 
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 bg-zinc-900 rounded-lg h-1"
                    aria-label="Zoom profile image preview"
                  />
                </div>

                {/* Rotation control */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span className="flex items-center gap-1"><RotateCw className="w-3.5 h-3.5" /> ROTATION</span>
                    <span>{rotation}°</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRotation((prev) => (prev - 90) % 360)}
                      className="flex-1 py-1 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-[10px] font-semibold rounded-lg font-mono tracking-wider transition-colors"
                    >
                      Rotate Left
                    </button>
                    <button
                      onClick={() => setRotation((prev) => (prev + 90) % 360)}
                      className="flex-1 py-1 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-[10px] font-semibold rounded-lg font-mono tracking-wider transition-colors"
                    >
                      Rotate Right
                    </button>
                  </div>
                </div>

              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleBackToMenu}
                  className="flex-1 px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-900 hover:border-zinc-800 font-medium text-xs transition-colors focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs transition-colors shadow-lg shadow-emerald-500/10 focus:outline-none"
                >
                  Save Changes
                </button>
              </div>

            </div>
          )}

          {step === "loading" && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <div className="text-xs font-mono font-bold text-zinc-300 tracking-wider">
                {loadingText}
              </div>
              <div className="text-[10px] font-mono text-zinc-500">
                Securing digital operator payload...
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
