import { useState, useRef } from 'react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { ClassificationOutput } from './components/ClassificationOutput';
import { RatingPopup } from './components/RatingPopup';

// --- ADD THIS LINE HERE ---
const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPrediction(null);
      
      if (file.name.toLowerCase().endsWith('.mha')) {
        setLoading(true);
        try {
          const formData = new FormData();
          formData.append("file", file);

          // --- UPDATED FETCH URL ---
          const response = await fetch(`${API_BASE}/preview`, {
            method: "POST",
            body: formData,
          });

          const result = await response.json();
          if (result.preview_image) {
            setPreviewUrl(result.preview_image);
          }
        } catch (err) {
          console.error("Preview generation failed:", err);
          setPreviewUrl(null);
        } finally {
          setLoading(false);
        }
      } else {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    }
  };

    const handleClassify = async () => {
    if (!selectedFile) return;
    setLoading(true);
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
      setShowRatingPopup(true);
    } catch (err) {
      console.error("Prediction failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = (ratings) => {
    console.log("User ratings:", ratings);
    // backend logic wla p
  };

  return (
    <div className="h-screen bg-[#111827] text-white flex flex-col font-sans overflow-hidden">
      <Header />
      <main className="flex-1 overflow-hidden px-4 py-3">
        <div className="h-full max-w-[1800px] mx-auto">
          <ClassificationOutput 
            imageSrc={previewUrl} 
            prediction={prediction}
            loading={loading}
            selectedFile={selectedFile}
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
            handleClassify={handleClassify}
          />
        </div>
      </main>

      {/* Rating Popup */}
      <RatingPopup 
        isOpen={showRatingPopup}
        onClose={() => setShowRatingPopup(false)}
        onSubmit={handleRatingSubmit}
      />

      {/* Footer - Compact */}
      <footer className="border-t py-2 bg-linear-to-b from-[#1E3A8A] via-[#1F2937] to-[#111827] shrink-0">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[#F9FAFB] font-semibold text-xs">
            Nodule Detection System – Enhanced ResNet-50 with Lightweight Transformer and Spatial Attention
          </p>
        </div>
      </footer>
    </div>
  );
}