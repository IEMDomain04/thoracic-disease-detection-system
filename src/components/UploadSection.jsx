import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Upload } from "lucide-react";
import { useRef, useState, useEffect } from "react";

// --- ADD THIS LINE HERE ---
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
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile, setPreviewUrl]);

  const openFileDialog = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClassify = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    setPrediction(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // --- UPDATED FETCH URL ---
      const response = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      setPrediction(result);

      if (result.preview_image) {
        setPreviewUrl(result.preview_image);
      }
    } catch (err) {
      setError("Prediction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-b from-[#1E3A8A] via-[#1F2937] to-[#111827] text-[#F9FAFB] border-none shadow-lg">
      <CardHeader className="pb-3"></CardHeader>
      <CardContent className="space-y-3">
        <Button
          className="w-full cursor-pointer bg-[#14B8A6] hover:bg-[#10A39B] active:bg-[#0c7d77] text-white font-medium transition-all"
          onClick={handleClassify}
          disabled={!selectedFile || loading}
        >
          {loading ? "Analyzing..." : "Classify Image"}
        </Button>
      </CardContent>
    </Card>
  );
}
