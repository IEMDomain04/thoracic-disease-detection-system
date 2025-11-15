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
    <div className="min-h-screen bg-[#111827] text-white flex flex-col font-sans">
      {/* Header */}
      <Header />

      <main className="w-full px-6 py-6 flex-1">
        {/* Results Section - Full Screen */}
        <section className="w-full max-w-7xl mx-auto h-full">
          <div className="bg-[#1F2937] rounded-2xl shadow-lg p-6 border border-[#2E3A59] h-full flex flex-col">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-[#F9FAFB] mb-2 border-b border-[#374151] pb-2">
                AI Analysis Result
              </h2>
              <p className="text-sm text-[#9CA3AF]">
                The AI model highlights suspicious nodule regions in the uploaded chest X-ray or MHA image.
              </p>
            </div>

            <div className="flex-1">
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

            {/* Status message */}
            {loading && (
              <p className="text-[#38BDF8] mt-4 text-center font-medium">
                Analyzing image... please wait.
              </p>
            )}
            {!loading && !prediction && (
              <p className="text-[#9CA3AF] mt-4 text-center">
                Upload an image using the controls above to begin analysis.
              </p>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-4 border-t py-3 bg-gradient-to-b from-[#1E3A8A] via-[#1F2937] to-[#111827]">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[#F9FAFB] font-semibold text-sm">
            Nodule Detection System – Enhanced ResNet-50 + CBAM + ViT
          </p>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Designed with clinical feedback for interpretability and ease of use.
          </p>
        </div>
      </footer>
    </div>
  );
}
