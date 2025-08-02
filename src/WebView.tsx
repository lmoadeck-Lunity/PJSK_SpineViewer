import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";

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
  const [showChibiDropdown, setShowChibiDropdown] = useState(false);
  const [showAnimDropdown, setShowAnimDropdown] = useState(false);

  // Update local state when props change
  useEffect(() => {
    setSelectedChibi(currentChibi);
  }, [currentChibi]);

  useEffect(() => {
    setSelectedAnimation(currentAnimation);
  }, [currentAnimation]);

  const handleChibiSelect = async (chibi: ChibiOption) => {
    setSelectedChibi(chibi);
    setShowChibiDropdown(false);
    await onChibiSelect(chibi.value);
  };

  const handleAnimationSelect = (animation: string) => {
    setSelectedAnimation(animation);
    setShowAnimDropdown(false);
    onAnimationSelect(animation);
  };

  const handleExportGIF = async () => {
    if (!selectedAnimation) return;
    
    setIsExporting(true);
    try {
      await onExportGIF(selectedAnimation, 30);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#2c2c2c',
    border: '1px solid #555',
    borderRadius: '4px',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 1000,
    boxShadow: '0px 2px 6px 2px rgba(0, 0, 0, 0.25)'
  };

  const optionStyle: React.CSSProperties = {
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #444',
    backgroundColor: 'transparent',
    color: 'white'
  };

  const optionHoverStyle: React.CSSProperties = {
    ...optionStyle,
    backgroundColor: '#404040'
  };

  return (
    <div style={{
      position: 'relative',
      height: '720px',
      backgroundColor: '#424242',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '16px',
      width: '100%'
    }}>
      {/* Canvas container */}
      <div style={{
        position: 'absolute',
        top: '104px',
        right: '81px',
        width: '512px',
        height: '512px',
        backgroundColor: '#d9d9d9'
      }}>
        <canvas 
          ref={canvas}
          style={{ 
            width: '100%',
            height: '100%',
            display: 'block'
          }}
        />
      </div>

      <div style={{
        width: '421px',
        height: '589px',
        backgroundColor: '#5f5f5f',
        borderRadius: '8px',
        position: 'absolute',
        top: '20px',
        left: '219px',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
      }}>
        <h1 style={{
          color: 'white',
          fontWeight: 600,
          fontSize: '32px',
          margin: '0 0 32px 0',
          fontFamily: 'Arial, sans-serif'
        }}>
          Sekai Chibi Viewer
        </h1>

        {/* Loading indicator */}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid #f3f3f3',
              borderTop: '2px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{ color: 'white', fontSize: '14px' }}>Loading...</span>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        {/* Chibi selector */}
        <div style={{ marginBottom: '24px', position: 'relative' }}>
          <label style={{ color: 'white', display: 'block', marginBottom: '8px', fontSize: '14px' }}>
            Chibi
          </label>
          <div 
            onClick={() => !isLoading && setShowChibiDropdown(!showChibiDropdown)}
            style={{
              width: '100%',
              height: '48px',
              backgroundColor: 'white',
              border: '3px solid #6750a4',
              borderRadius: '4px',
              padding: '12px 16px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            <span>{selectedChibi?.label || 'Select a chibi...'}</span>
            <span style={{ fontSize: '12px' }}>▼</span>
          </div>
          
          {showChibiDropdown && (
            <div style={dropdownStyle}>
              {chibis.map((chibi) => (
                <div
                  key={chibi.value}
                  onClick={() => handleChibiSelect(chibi)}
                  style={optionStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#404040';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {chibi.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Animation selector */}
        <div style={{ marginBottom: '24px', position: 'relative' }}>
          <label style={{ color: 'white', display: 'block', marginBottom: '8px', fontSize: '14px' }}>
            Animation
          </label>
          <div 
            onClick={() => !isLoading && selectedChibi && setShowAnimDropdown(!showAnimDropdown)}
            style={{
              width: '100%',
              height: '48px',
              backgroundColor: 'white',
              border: '3px solid #6750a4',
              borderRadius: '4px',
              padding: '12px 16px',
              cursor: (isLoading || !selectedChibi) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              opacity: (isLoading || !selectedChibi) ? 0.6 : 1
            }}
          >
            <span>{selectedAnimation || 'Select an animation...'}</span>
            <span style={{ fontSize: '12px' }}>▼</span>
          </div>
          
          {showAnimDropdown && (
            <div style={dropdownStyle}>
              {animations.map((animation) => (
                <div
                  key={animation}
                  onClick={() => handleAnimationSelect(animation)}
                  style={optionStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#404040';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {animation}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export GIF button */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={handleExportGIF}
            disabled={!selectedAnimation || isExporting || isLoading}
            style={{
              width: '100%',
              height: '48px',
              backgroundColor: (!selectedAnimation || isExporting || isLoading) ? '#cccccc' : '#6750a4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (!selectedAnimation || isExporting || isLoading) ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isExporting ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Exporting GIF...
              </>
            ) : (
              'Export as GIF'
            )}
          </button>
        </div>

        {/* Current status */}
        {selectedChibi && (
          <div>
            <p style={{ color: 'white', fontSize: '14px', margin: '0 0 8px 0' }}>
              Current Chibi: {selectedChibi.label}
            </p>
            {selectedAnimation && (
              <p style={{ color: 'white', fontSize: '14px', margin: '0' }}>
                Current Animation: {selectedAnimation}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Add CSS animation for spinner */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
    </div>
  );
};

export default WebView;