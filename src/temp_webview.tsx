import React, { useState, useEffect } from "react";
import { NumberInput, Select, SelectItem } from "@heroui/react";

interface ChibiOption {
  value: string;
  label: string;
}

interface WebViewProps {
  canvas: React.RefObject<HTMLCanvasElement>;
  chibis: ChibiOption[];
  animations: string[];
  isLoading: boolean;
  error: string | null;
  currentChibi: ChibiOption | null;
  currentAnimation: string | null;
  onChibiSelect: (chibiName: string) => Promise<boolean>;
  onAnimationSelect: (animationName: string) => boolean;
  onExportGIF: (animationName: string, fps?: number) => Promise<boolean>;
}

const WebView: React.FC<WebViewProps> = ({
  canvas,
  chibis,
  animations,
  isLoading,
  error,
  currentChibi,
  currentAnimation,
  onChibiSelect,
  onAnimationSelect,
  onExportGIF
}) => {
  const [selectedChibi, setSelectedChibi] = useState<ChibiOption | null>(currentChibi);
  const [selectedAnimation, setSelectedAnimation] = useState<string | null>(currentAnimation);
  const [isExporting, setIsExporting] = useState(false);
  const [fps, setFps] = useState<number>(30);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 720);



  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 720);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update local state when props change
  useEffect(() => {
    setSelectedChibi(currentChibi);
  }, [currentChibi]);

  useEffect(() => {
    setSelectedAnimation(currentAnimation);
  }, [currentAnimation]);

  const handleChibiSelect = async (key: string) => {
    const chibi = chibis.find(c => c.value === key);
    if (chibi) {
      setSelectedChibi(chibi);
      await onChibiSelect(chibi.value);
    }
  };

  const handleAnimationSelect = (key: string) => {
    setSelectedAnimation(key);
    onAnimationSelect(key);
  };

  const handleExportGIF = async () => {
    if (!selectedAnimation) return;
    
    setIsExporting(true);
    try {
      await onExportGIF(selectedAnimation, fps);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`min-h-screen w-full flex ${isMobileView ? 'flex-col bg-[#264c65]' : 'flex-row bg-[#30336d]'} items-center ${isMobileView ? 'gap-5 p-5' : 'gap-[75px] p-14'} relative`}>
      {isMobileView && (
        <div className="bg-[#2d2d2d] rounded-[5px] w-[300px] h-[300px] max-w-[90vw] max-h-[50vh] relative overflow-hidden">
          <canvas
            ref={canvas}
            className="w-full h-full bg-transparent"
            aria-label="Spine Animation Canvas"
          />
        </div>
      )}

      <div className={`bg-[#254c64] rounded-lg p-5 flex flex-col gap-6 ${isMobileView ? 'w-full max-w-[430px]' : 'w-80 max-w-80'}`}>
        <div className="text-white text-lg font-medium text-center mb-4">
          Project Sekai Chibi Viewer
        </div>
        
        {error && (
          <div className="text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <Select
          aria-label="Chibi Selector"
          label="Chibi Selector"
          placeholder="Select a chibi"
          variant="flat"
          labelPlacement="outside"
          selectedKeys={selectedChibi ? [selectedChibi.value] : []}
          onSelectionChange={(keys) => {
            const key = Array.from(keys)[0] as string;
            if (key) handleChibiSelect(key);
          }}
          isDisabled={isLoading}
          className="w-full"
          classNames={{
            label: "text-white text-sm font-medium mb-2",
            trigger: "bg-white/10 border-white/20 text-white",
            value: "text-white",
            popoverContent: "bg-gray-800 border-gray-600",
            listboxWrapper: "max-h-60"
          }}
        >
          {chibis.map((chibi) => (
            <SelectItem key={chibi.value} className="text-white data-[hover=true]:bg-gray-700">
              {chibi.label}
            </SelectItem>
          ))}
        </Select>

        <Select
          aria-label="Animation Selector"
          label="Animation Selector"
          placeholder="Select an animation"
          variant="flat"
          labelPlacement="outside"
          selectedKeys={selectedAnimation ? [selectedAnimation] : []}
          onSelectionChange={(keys) => {
            const key = Array.from(keys)[0] as string;
            if (key) handleAnimationSelect(key);
          }}
          isDisabled={isLoading || !selectedChibi}
          className="w-full"
          classNames={{
            label: "text-white text-sm font-medium mb-2",
            trigger: "bg-white/10 border-white/20 text-white",
            value: "text-white",
            popoverContent: "bg-gray-800 border-gray-600",
            listboxWrapper: "max-h-60"
          }}
        >
          {animations.map((animation) => (
            <SelectItem key={animation} className="text-white data-[hover=true]:bg-gray-700">
              {animation}
            </SelectItem>
          ))}
        </Select>

        <NumberInput
          aria-label="FPS Selector"
          label="FPS Selector"
          placeholder="Enter FPS"
          variant="bordered"
          labelPlacement="outside"
          value={fps}
          onValueChange={(value) => setFps(Number(value) || 30)}
          minValue={10}
          maxValue={60}
          step={1}
          className="w-full"
          classNames={{
            label: "text-white text-sm font-medium mb-2",
            input: "text-white",
            inputWrapper: "bg-white/10 border-white/20 data-[hover=true]:border-white/40 group-data-[focus=true]:border-white/60"
          }}
        />

        <button
          className={`w-full py-3 px-6 rounded-lg text-white text-sm font-medium transition-colors duration-200 ${
            isExporting || !selectedAnimation 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-[#218964] hover:bg-[#1a6b4f] focus:outline-none focus:ring-2 focus:ring-[#218964] focus:ring-offset-2 focus:ring-offset-[#254c64]'
          }`}
          onClick={handleExportGIF}
          disabled={isExporting || !selectedAnimation}
          aria-label="Export GIF"
        >
          {isExporting ? 'Exporting...' : 'Export GIF'}
        </button>

        {isLoading && (
          <div className="text-white text-sm text-center flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Loading...
          </div>
        )}
      </div>

      {!isMobileView && (
        <div className="bg-[#2d2d2d] rounded-[5px] w-[335px] h-[335px] relative overflow-hidden">
          <canvas
            ref={canvas}
            className="w-full h-full bg-transparent"
            aria-label="Spine Animation Canvas"
          />
        </div>
      )}
    </div>
  );
};

export default WebView;