import { useState, useRef } from 'react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { ClassificationOutput } from './components/ClassificationOutput';

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Clear previous prediction when new file is selected
      setPrediction(null);
      
      // For .mha files, we need to convert them on the backend for preview
      // For regular image files, we can create a local preview
      if (file.name.toLowerCase().endsWith('.mha')) {
        // Send to backend to get preview
        setLoading(true);
        try {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("http://127.0.0.1:8000/preview", {
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
        // For regular images (jpg, png), create local preview
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

      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      setPrediction(result);
      
      // Update preview with backend-generated image if available
      if (result.preview_image) {
        setPreviewUrl(result.preview_image);
      }
    } catch (err) {
      console.error("Prediction failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#111827] text-white flex flex-col font-sans overflow-hidden">
      {/* Header - Compact */}
      <Header />

      {/* Main Content - Takes remaining height */}
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

      {/* Footer - Compact */}
      <footer className="border-t py-2 bg-gradient-to-b from-[#1E3A8A] via-[#1F2937] to-[#111827] flex-shrink-0">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[#F9FAFB] font-semibold text-xs">
            Nodule Detection System – Enhanced ResNet-50 + CBAM + ViT
          </p>
        </div>
      </footer>
    </div>
  );
}
