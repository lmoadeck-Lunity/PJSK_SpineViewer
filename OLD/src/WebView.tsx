import React, { useState, useEffect, useRef } from "react";

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
    maxHeight: isMobileView ? '120px' : '200px',
    overflowY: 'auto',
    zIndex: 1000,
    boxShadow: '0px 2px 6px 2px rgba(0, 0, 0, 0.25)'
  };

  const optionStyle: React.CSSProperties = {
    padding: isMobileView ? '8px 12px' : '12px 16px',
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
      height: 'auto',
      minHeight: '100vh',
      backgroundColor: '#424242',
      overflow: 'visible',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      padding: isMobileView ? '8px' : '16px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      
      {/* Control Panel */}
      <div 
        style={{
          width: isMobileView ? '100%' : '421px',
          height: 'auto',
          minHeight: isMobileView ? '200px' : '589px',
          maxHeight: 'none',
          backgroundColor: '#5f5f5f',
          borderRadius: '8px',
          position: isMobileView ? 'relative' : 'absolute',
          top: isMobileView ? '0' : '20px',
          left: isMobileView ? '0' : '219px',
          display: 'flex',
          flexDirection: 'column',
          padding: isMobileView ? '12px' : '24px',
          marginBottom: isMobileView ? '12px' : '0',
          boxSizing: 'border-box',
          maxWidth: isMobileView ? '100%' : 'none',
          border: isMobileView ? '2px solid #6750a4' : 'none'
        }}
      >
        {/* Drag handle for mobile */}
        {isMobileView && (
          <div style={{
            width: '40px',
            height: '4px',
            backgroundColor: '#888',
            borderRadius: '2px',
            margin: '0 auto 12px auto'
          }} />
        )}

        <h1 style={{
          color: 'white',
          fontWeight: 600,
          fontSize: isMobileView ? '20px' : '32px',
          margin: '0 0 8px 0',
          fontFamily: 'Arial, sans-serif',
          textAlign: isMobileView ? 'center' : 'left'
        }}>
          Sekai Chibi Viewer
        </h1>
        
        <p style={{ 
          color: 'white', 
          fontSize: isMobileView ? '10px' : '14px', 
          marginBottom: isMobileView ? '8px' : '24px',
          textAlign: isMobileView ? 'center' : 'left',
          wordBreak: 'break-all'
        }}>
          <a
            href="https://github.com/lmoadeck-Lunity/PJSK_SpineViewer"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#90caf9', textDecoration: 'underline' }}
          >
            {isMobileView ? 'GitHub Repo' : 'https://github.com/lmoadeck-Lunity/PJSK_SpineViewer'}
          </a>
        </p>
        {/* Loading indicator */}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: isMobileView ? '8px' : '16px', justifyContent: isMobileView ? 'center' : 'flex-start' }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid #f3f3f3',
              borderTop: '2px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{ color: 'white', fontSize: isMobileView ? '12px' : '14px' }}>Loading...</span>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: isMobileView ? '8px' : '12px',
            borderRadius: '4px',
            marginBottom: isMobileView ? '8px' : '16px',
            border: '1px solid #f5c6cb',
            fontSize: isMobileView ? '10px' : '14px'
          }}>
            {error}
          </div>
        )}

        {/* Chibi selector */}
        <div style={{ marginBottom: isMobileView ? '8px' : '24px', position: 'relative' }}>
          <label style={{ color: 'white', display: 'block', marginBottom: '4px', fontSize: isMobileView ? '12px' : '14px' }}>
            Chibi
          </label>
          <div 
            onClick={() => !isLoading && setShowChibiDropdown(!showChibiDropdown)}
            style={{
              width: isMobileView ? '100%' : '80%',
              height: isMobileView ? '36px' : '48px',
              backgroundColor: 'white',
              border: '3px solid #6750a4',
              borderRadius: '4px',
              padding: isMobileView ? '6px 12px' : '12px 16px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            <span style={{ 
              fontSize: isMobileView ? '12px' : '24px',
              color: '#000000',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {selectedChibi?.label || 'Select a chibi...'}
            </span>
            <span style={{ fontSize: '10px', color: '#000000', flexShrink: 0 }}>▼</span>
          </div>
          
          {showChibiDropdown && (
            <div style={{
              ...dropdownStyle,
              width: isMobileView ? '100%' : 'auto'
            }}>
              {chibis.map((chibi) => (
                <div
                  key={chibi.value}
                  onClick={() => handleChibiSelect(chibi)}
                  style={{
                    ...optionStyle,
                    fontSize: isMobileView ? '11px' : '16px'
                  }}
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
        <div style={{ marginBottom: isMobileView ? '8px' : '24px', position: 'relative' }}>
          <label style={{ color: 'white', display: 'block', marginBottom: '4px', fontSize: isMobileView ? '12px' : '14px' }}>
            Animation
          </label>
          <div 
            onClick={() => !isLoading && selectedChibi && setShowAnimDropdown(!showAnimDropdown)}
            style={{
              width: isMobileView ? '100%' : '80%',
              height: isMobileView ? '36px' : '48px',
              backgroundColor: 'white',
              border: '3px solid #6750a4',
              borderRadius: '4px',
              padding: isMobileView ? '6px 12px' : '12px 16px',
              cursor: (isLoading || !selectedChibi) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              opacity: (isLoading || !selectedChibi) ? 0.6 : 1
            }}
          >
            <span style={{ 
              fontSize: isMobileView ? '12px' : '24px',
              color: '#000000',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {selectedAnimation || 'Select an animation...'}
            </span>
            <span style={{ fontSize: '10px', color: '#000000', flexShrink: 0 }}>▼</span>
          </div>
          
          {showAnimDropdown && (
            <div style={{
              ...dropdownStyle,
              width: isMobileView ? '100%' : 'auto'
            }}>
              {animations.map((animation) => (
                <div
                  key={animation}
                  onClick={() => handleAnimationSelect(animation)}
                  style={{
                    ...optionStyle,
                    fontSize: isMobileView ? '11px' : '16px'
                  }}
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
        <div style={{ marginBottom: isMobileView ? '8px' : '24px' }}>
          <button
            onClick={handleExportGIF}
            disabled={!selectedAnimation || isExporting || isLoading}
            style={{
              width: '100%',
              height: isMobileView ? '36px' : '48px',
              backgroundColor: (!selectedAnimation || isExporting || isLoading) ? '#cccccc' : '#6750a4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (!selectedAnimation || isExporting || isLoading) ? 'not-allowed' : 'pointer',
              fontSize: isMobileView ? '12px' : '16px',
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
                  width: isMobileView ? '16px' : '20px',
                  height: isMobileView ? '16px' : '20px',
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
            <p style={{ 
              color: 'white', 
              fontSize: isMobileView ? '10px' : '14px', 
              margin: '0 0 4px 0',
              textAlign: isMobileView ? 'center' : 'left'
            }}>
              Current Chibi: {selectedChibi.label}
            </p>
            {selectedAnimation && (
              <p style={{ 
                color: 'white', 
                fontSize: isMobileView ? '10px' : '14px', 
                margin: '0',
                textAlign: isMobileView ? 'center' : 'left'
              }}>
                Current Animation: {selectedAnimation}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Canvas container */}
      <div 
        style={{
          width: isMobileView ? '100%' : '512px',
          height: isMobileView ? '350px' : '512px',
          maxWidth: isMobileView ? '100%' : '512px',
          backgroundColor: '#d9d9d9',
          borderRadius: '8px',
          position: isMobileView ? 'relative' : 'absolute',
          top: isMobileView ? '0' : '104px',
          right: isMobileView ? '0' : '81px',
          boxSizing: 'border-box',
          flexShrink: 0,
          marginBottom: isMobileView ? '8px' : '0',
          border: isMobileView ? '2px solid #6750a4' : 'none'
        }}
      >
        {/* Visual indicator for mobile */}
        {isMobileView && (
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '40px',
            height: '4px',
            backgroundColor: '#888',
            borderRadius: '2px',
            zIndex: 1001
          }} />
        )}
        
        <canvas 
          ref={canvas}
          style={{ 
            width: '100%',
            height: '100%',
            display: 'block',
            borderRadius: isMobileView ? '6px' : '0',
            marginTop: isMobileView ? '12px' : '0'
          }}
        />
      </div>

      {/* Add CSS animation for spinner and enhanced styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @media (max-width: 720px) {
            body {
              margin: 0;
              padding: 0;
              overflow-y: auto;
            }
            
            html {
              overflow-y: auto;
            }
          }
        `
      }} />
    </div>
  );
};

export default WebView;