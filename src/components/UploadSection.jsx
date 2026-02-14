import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Upload, Cloud, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { useRef, useState } from "react";
import { CloudLibraryModal } from "./CloudLibraryModal";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export function UploadSection({
  selectedFile,
  setSelectedFile,
  previewUrl,
  setPreviewUrl,
  prediction,
  setPrediction,
  loading,
  setLoading,
  setShowRatingPopup,
  zoom,
  setZoom,
  handleResetView
}) {
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // =========================
  // Prediction Logic (UI Helpers)
  // =========================
  const predictedClass = prediction?.prediction || prediction?.class || "--";
  const confidence = prediction?.confidence != null ? Number(prediction.confidence) : null;
  const confPercent = confidence != null ? (confidence > 1 ? confidence : confidence * 100).toFixed(2) : null;
  
  const hasNodule = predictedClass.toLowerCase().includes("nodule") && !predictedClass.toLowerCase().includes("no nodule");
  const badgeColor = predictedClass === "--" ? "text-[#9CA3AF] border-[#9CA3AF]/50" : hasNodule ? "text-red-400 bg-red-400/10 border-red-400/50" : "text-green-400 bg-green-400/10 border-green-400/50";
  const progressBarColor = hasNodule ? "bg-red-400" : "bg-green-400";

  // =========================
  // 1. Local File Handling
  // =========================
  const processLocalFile = async (file) => {
    if (!file) return;

    setSelectedFile(file);
    setPrediction(null);
    setError(null);

    if (file.name.toLowerCase().endsWith(".mha")) {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${API_BASE}/preview`, {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (result.preview_image) {
          setPreviewUrl(result.preview_image);
        } else {
          setError("Could not generate preview.");
        }
      } catch (err) {
        setError("Server preview failed.");
      } finally {
        setLoading(false);
      }
    } else {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const openFileDialog = () => fileInputRef.current?.click();
  const handleFileChange = (e) => { const file = e.target.files?.[0]; processLocalFile(file); };

  // =========================
  // 2. Cloud File Handling (THIS WAS MISSING)
  // =========================
  const handleLibrarySelect = async (caseItem) => {
    setIsLibraryOpen(false);
    setPrediction(null);
    setError(null);
    setPreviewUrl(null);
    
    // Create special cloud file object
    const cloudFileObj = { 
        name: caseItem.title, 
        googleDriveId: caseItem.googleDriveId, 
        isCloud: true 
    };
    setSelectedFile(cloudFileObj);

    // Fetch Preview immediately
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/preview_from_library`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_id: caseItem.googleDriveId }),
      });
      const result = await response.json();
      if (result.preview_image) {
        setPreviewUrl(result.preview_image);
      } else {
        setError("Preview not available on server.");
      }
    } catch (err) {
      console.error("Cloud preview failed", err);
      setError("Could not load cloud preview.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 3. Classification Handling
  // =========================
  const handleClassify = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      let response;

      if (selectedFile.isCloud) {
        response = await fetch(`${API_BASE}/predict_from_library`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_id: selectedFile.googleDriveId }),
        });
      } else {
        const formData = new FormData();
        formData.append("file", selectedFile);
        response = await fetch(`${API_BASE}/predict`, {
          method: "POST",
          body: formData,
        });
      }

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      setPrediction(result);
      if (result.preview_image) setPreviewUrl(result.preview_image);

      if (setShowRatingPopup) setShowRatingPopup(true);
    } catch (err) {
      setError("Prediction failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="bg-[#1F2937] border border-gray-700 shadow-none rounded-lg w-72 shrink-0 flex flex-col h-full">
        <CardContent className="space-y-3 p-3 flex-1 overflow-y-auto">

          {/* Results Section (Moved inside upload section based on your previous UI needs) */}
          {prediction && (
            <div className="p-3 bg-gradient-to-b from-[#1E3A8A] via-[#1F2937] to-[#111827] rounded-lg border border-[#374151]">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-[#9CA3AF] mb-1.5">Prediction:</p>
                  <Badge variant="outline" className={`text-xs px-2 py-1 font-semibold ${badgeColor} w-full justify-center`}>
                    {predictedClass}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-[#9CA3AF] mb-1.5">Confidence:</p>
                  <div className="flex items-center gap-2">
                    <span className="text-base text-[#E5E7EB] font-bold min-w-14">{confPercent != null ? `${confPercent}%` : "--%"}</span>
                    <div className="flex-1 bg-[#374151] rounded-full h-2.5 overflow-hidden">
                      <div className={`${progressBarColor} h-full rounded-full transition-all duration-500`} style={{ width: confPercent != null ? `${confPercent}%` : "0%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status Banners */}
          {previewUrl && !prediction && !loading && (
            <div className="p-2 bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 rounded-lg">
              <p className="text-xs text-[#38BDF8] text-center leading-relaxed">📷 <strong>Preview Mode</strong><br />Click Classify to analyze</p>
            </div>
          )}
          {loading && (
            <div className="p-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg">
              <p className="text-xs text-[#F59E0B] text-center leading-relaxed">⏳ <strong>Processing...</strong><br />{prediction ? "Analyzing" : "Loading preview"}</p>
            </div>
          )}

          <h3 className="text-xs font-semibold text-[#E5E7EB] mt-2">Upload & Controls</h3>

          <input className="hidden" ref={fileInputRef} onChange={handleFileChange} type="file" accept=".jpg,.jpeg,.png,.mha" />

          {selectedFile && (
            <div className="p-1.5 bg-[#111827] rounded border border-[#374151]">
              <p className="text-[10px] text-[#9CA3AF]">Selected:</p>
              <p className="text-xs text-[#E5E7EB] truncate font-medium">{selectedFile.name}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button className="btn-choosefile cursor-pointer flex-1 bg-[#0EA5E9] hover:bg-[#0d96d4] h-8 text-xs" onClick={openFileDialog}>
              <Upload className="mr-1 h-3 w-3" /> Local
            </Button>
            <Button className="btn-choosefile cursor-pointer flex-1 bg-[#0038c6] hover:bg-[#002a94] h-8 text-xs" onClick={() => setIsLibraryOpen(true)}>
              <Cloud className="mr-1 h-3 w-3" /> Cloud
            </Button>
          </div>

          <Button className="w-full btn-classify cursor-pointer bg-[#14B8A6] hover:bg-[#10A39B] h-8 text-xs" onClick={handleClassify} disabled={!selectedFile || loading}>
            {loading ? "Analyzing..." : "Classify"}
          </Button>

          {/* View Controls */}
          {previewUrl && (
            <div className="p-3 bg-[#1F2937] rounded-lg border border-[#374151] space-y-1.5">
              <h3 className="text-xs font-semibold text-[#E5E7EB] mb-2">
                View Controls
              </h3>

              <Button
                onClick={() => setZoom((prev) => Math.min(prev + 0.25, 5))}
                size="sm"
                variant="outline"
                className="btn-controls w-full bg-[#1F2937] border-[#374151] text-[#E5E7EB] hover:bg-[#374151] hover:text-white active:scale-90 justify-start h-8 text-xs cursor-pointer"
              >
                <ZoomIn className="h-3 w-3 mr-1.5" />
                Zoom In
              </Button>

              <Button
                onClick={() => setZoom((prev) => Math.max(prev - 0.25, 0.5))}
                size="sm"
                variant="outline"
                className="btn-controls w-full bg-[#1F2937] border-[#374151] text-[#E5E7EB] hover:bg-[#374151] hover:text-white active:scale-90 justify-start h-8 text-xs cursor-pointer"
              >
                <ZoomOut className="h-3 w-3 mr-1.5" />
                Zoom Out
              </Button>

              <Button
                onClick={handleResetView}
                size="sm"
                variant="outline"
                className="btn-controls w-full bg-[#1F2937] border-[#374151] text-[#E5E7EB] hover:bg-[#374151] hover:text-white active:scale-90 justify-start h-8 text-xs cursor-pointer"
              >
                <Maximize2 className="h-3 w-3 mr-1.5" />
                Reset View
              </Button>

              <div className="pt-1.5 text-center">
                <span className="text-[10px] text-[#9CA3AF]">
                  Zoom:{" "}
                  <span className="font-semibold text-[#E5E7EB]">
                    {Math.round(zoom * 100)}%
                  </span>
                </span>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-400 text-center">{error}</p>}

        </CardContent>
      </Card>

      {/* CRITICAL FIX: 
          Passed `handleLibrarySelect` to the `onSelect` prop.
      */}
      <CloudLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelect={handleLibrarySelect} 
      />
    </>
  );
}