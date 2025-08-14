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

  const containerStyle: React.CSSProperties = {
    alignItems: 'center',
    backgroundColor: isMobileView ? '#264c65' : '#30336d',
    display: 'flex',
    flexDirection: isMobileView ? 'column' : 'row',
    gap: isMobileView ? '20px' : '75px',
    minHeight: isMobileView ? '100vh' : '600px',
    minWidth: isMobileView ? '100%' : '800px',
    padding: isMobileView ? '20px' : '56px 34px',
    position: 'relative',
    width: '100%'
  };

  const controlPanelStyle: React.CSSProperties = {
    backgroundColor: '#254c64',
    borderRadius: '10px',
    padding: '20px',
    width: isMobileView ? '100%' : '320px',
    maxWidth: isMobileView ? '430px' : '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  };

  const canvasContainerStyle: React.CSSProperties = {
    backgroundColor: '#2d2d2d',
    borderRadius: '5px',
    height: isMobileView ? '300px' : '335px',
    width: isMobileView ? '300px' : '335px',
    maxWidth: isMobileView ? '90vw' : '335px',
    maxHeight: isMobileView ? '50vh' : '335px',
    position: 'relative',
    overflow: 'hidden'
  };

  const titleStyle: React.CSSProperties = {
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: '16px'
  };

  const exportButtonStyle: React.CSSProperties = {
    backgroundColor: isExporting || !selectedAnimation ? '#666' : '#218964',
    borderRadius: '7px',
    border: 'none',
    color: '#ffffff',
    cursor: isExporting || !selectedAnimation ? 'not-allowed' : 'pointer',
    fontSize: '12px',
    fontWeight: '400',
    padding: '12px 24px',
    textAlign: 'center',
    width: '100%',
    marginTop: '16px',
    transition: 'background-color 0.2s'
  };

  return (
    <>
      <style>{`
        :root {
          --heroui-default-foreground: 255 255 255;
        }
        .heroui-select [data-slot="trigger"] * {
          color: white !important;
        }
        .heroui-select [data-slot="value"] * {
          color: white !important;
        }
        .heroui-select [data-slot="label"] {
          color: white !important;
        }
        .heroui-number-input [data-slot="input"] {
          color: white !important;
        }
        .heroui-number-input [data-slot="label"] {
          color: white !important;
        }
        .heroui-listbox [data-slot="item"] {
          color: white !important;
        }
        .group[data-has-value="true"] * {
          color: white !important;
        }
        .group-data-\\[has-value\\=true\\]\\:text-default-foreground {
          color: white !important;
        }
        [data-slot="trigger"][data-focus="true"] {
          border-color: white !important;
        }
        [data-slot="trigger"][data-open="true"] {
          border-color: white !important;
        }
        [data-slot="trigger"][data-hover="true"] {
          border-color: rgba(255, 255, 255, 0.6) !important;
        }
        [data-slot="trigger"][data-hover="true"] * {
          color: white !important;
        }
        [data-slot="item"][data-hover="true"] {
          color: white !important;
        }
        [data-slot="item"][data-hover="true"] * {
          color: white !important;
        }
      `}</style>
      <div style={containerStyle}>
      {isMobileView && (
        <div style={canvasContainerStyle}>
          <canvas
            ref={canvas}
            style={{ width: '100%', height: '100%' }}
            aria-label="Spine Animation Canvas"
          />
        </div>
      )}

      <div style={controlPanelStyle}>
        <div style={titleStyle}>Project Sekai Chibi Viewer</div>
        
        {error && (
          <div style={{ color: '#ff6b6b', fontSize: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <Select
          aria-label="Chibi Selector"
          label="Chibi Selector"
          placeholder="Select a chibi"
          variant="bordered"
          labelPlacement="outside"
          selectedKeys={selectedChibi ? [selectedChibi.value] : []}
          onSelectionChange={(keys) => {
            const key = Array.from(keys)[0] as string;
            if (key) handleChibiSelect(key);
          }}
          isDisabled={isLoading}
          style={{ width: '100%', color: 'white' }}
          classNames={{
            trigger: "text-white",
            value: "text-white",
            label: "text-white",
            listboxWrapper: "text-white",
            popoverContent: "bg-gray-800"
          }}
        >
          {chibis.map((chibi) => (
            <SelectItem key={chibi.value} className="text-white">
              {chibi.label}
            </SelectItem>
          ))}
        </Select>

        <Select
          aria-label="Animation Selector"
          label="Animation Selector"
          placeholder="Select an animation"
          variant="bordered"
          labelPlacement="outside"
          selectedKeys={selectedAnimation ? [selectedAnimation] : []}
          onSelectionChange={(keys) => {
            const key = Array.from(keys)[0] as string;
            if (key) handleAnimationSelect(key);
          }}
          isDisabled={isLoading || !selectedChibi}
          style={{ width: '100%', color: 'white' }}
          classNames={{
            trigger: "text-white",
            value: "text-white",
            label: "text-white",
            listboxWrapper: "text-white",
            popoverContent: "bg-gray-800"
          }}
        >
          {animations.map((animation) => (
            <SelectItem key={animation} className="text-white">
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
          style={{ width: '100%', color: 'white' }}
          classNames={{
            input: "text-white",
            label: "text-white"
          }}
        />

        <button
          style={exportButtonStyle}
          onClick={handleExportGIF}
          disabled={isExporting || !selectedAnimation}
          aria-label="Export GIF"
        >
          {isExporting ? 'Exporting...' : 'Export GIF'}
        </button>

        {isLoading && (
          <div style={{ color: '#ffffff', fontSize: '14px', textAlign: 'center' }}>
            Loading...
          </div>
        )}
      </div>

      {!isMobileView && (
        <div style={canvasContainerStyle}>
          <canvas
            ref={canvas}
            style={{ width: '100%', height: '100%' }}
            aria-label="Spine Animation Canvas"
          />
        </div>
      )}
    </div>
    </>
  );
};

export default WebView;
