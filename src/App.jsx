import { useState } from 'react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { ClassificationOutput } from './components/ClassificationOutput';

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-[#111827] text-white flex flex-col font-sans">
      {/* Header */}
      <Header />

      <main className="container mx-auto px-6 py-10 flex flex-col lg:flex-row gap-8 items-start justify-center">
        
        {/* Left panel — Upload and Preview */}
        <section className="flex-1 w-full">
          <div className="sticky top-6">
            <UploadSection
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              previewUrl={previewUrl}
              setPreviewUrl={setPreviewUrl}
              prediction={prediction}
              setPrediction={setPrediction}
              loading={loading}
              setLoading={setLoading}
            />
          </div>
        </section>

        {/* Right panel — Results and Analysis */}
        <section className="flex-1 w-full bg-[#1F2937] rounded-2xl shadow-lg p-6 border border-[#2E3A59]">
          <h2 className="text-2xl font-semibold text-[#F9FAFB] mb-4 border-b border-[#374151] pb-2">
            AI Analysis Result
          </h2>
          <p className="text-sm text-[#9CA3AF] mb-6">
            The AI model highlights suspicious nodule regions in the uploaded chest X-ray or MHA image.
          </p>

          <ClassificationOutput imageSrc={previewUrl} prediction={prediction} />

          {/* Status message */}
          {loading && (
            <p className="text-[#38BDF8] mt-4 text-center font-medium">
              Analyzing image... please wait.
            </p>
          )}
          {!loading && !prediction && (
            <p className="text-[#9CA3AF] mt-4 text-center">
              Upload an image to begin analysis.
            </p>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t py-6 bg-gradient-to-b from-[#1E3A8A] via-[#1F2937] to-[#111827]">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[#F9FAFB] font-semibold">
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
