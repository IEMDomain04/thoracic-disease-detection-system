import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { ClassificationOutput } from './components/ClassificationOutput';

export default function App() {
  return (
    <div className="min-h-screen [background-color:#1F2937] flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Upload X-ray Image */}
        <UploadSection />
        
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original X-ray */}
          <ClassificationOutput type="original" />
          
          {/* Grad-CAM Visualization */}
          <ClassificationOutput type="gradcam" />
        </div>
      </main>

      <footer className="mt-16 py-6 bg-gradient-to-b from-[#1E3A8A] via-[#1F2937] to-[#111827] text-[#F9FAFB]">
        <div className="container mx-auto px-4 text-center text-sm">
          <p className='text-[#F9FAFB] font-semibold'>Nodule System Classification - Enhancement of Resnet-50 with CBAM + ViT</p>
          <p className="text-xs text-[#9CA3AF] mt-1">For research and educational purposes only</p>
        </div>
      </footer>
    </div>
  );
}
