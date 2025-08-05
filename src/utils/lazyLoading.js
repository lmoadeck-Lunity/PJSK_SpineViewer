// import React from 'react';

// Lazy loading utilities for heavy dependencies

// import React from 'react';

// Lazy loading utilities for heavy dependencies

// Lazy loading utilities for heavy dependencies

// Lazy load GIF.js - handle both default and named exports
export const loadGifJS = async () => {
  try {
    // Try to import the module in a more controlled way
    const gifModule = await import('gif.js');
    
    console.log('Raw GIF module:', gifModule);
    console.log('GIF module keys:', Object.keys(gifModule));
    
    // Try different ways to get the constructor
    let GIFConstructor = null;
    
    // Method 1: Check for default export
    if (gifModule.default && typeof gifModule.default === 'function') {
      console.log('Using default export');
      GIFConstructor = gifModule.default;
    } 
    // Method 2: Check for named export
    else if (gifModule.GIF && typeof gifModule.GIF === 'function') {
      console.log('Using named GIF export');
      GIFConstructor = gifModule.GIF;
    }
    // Method 3: Check if the entire module is the constructor
    else if (typeof gifModule === 'function') {
      console.log('Using module as constructor');
      GIFConstructor = gifModule;
    }
    // Method 4: Look for any function property
    else {
      console.log('Searching for constructor in module properties');
      for (const [key, value] of Object.entries(gifModule)) {
        console.log(`Checking ${key}:`, typeof value);
        if (typeof value === 'function') {
          console.log(`Found constructor at ${key}`);
          GIFConstructor = value;
          break;
        }
      }
    }
    
    if (!GIFConstructor) {
      console.error('Could not find GIF constructor. Module structure:', gifModule);
      throw new Error('Could not find GIF constructor in module');
    }
    
    console.log('Successfully loaded GIF constructor');
    return GIFConstructor;
  } catch (error) {
    console.error('Failed to load GIF.js:', error);
    throw error;
  }
};

// Lazy load Spine WebGL
export const loadSpineWebGL = async () => {
  try {
    const spineModule = await import('@esotericsoftware/spine-webgl');
    return spineModule;
  } catch (error) {
    console.error('Failed to load Spine WebGL:', error);
    throw error;
  }
};

// Utility function to preload a module in the background
export const preloadModule = (moduleLoader) => {
  // Start loading the module but don't wait for it
  moduleLoader().catch(error => {
    console.warn('Failed to preload module:', error);
  });
};
