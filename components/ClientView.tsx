'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { LayoutUpdate as LayoutUpdateType, ClientIdentity, ModeChange } from '@/types/socket';

interface Layout {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export default function ClientView() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [layout, setLayout] = useState<Layout>({ x: 0, y: 0, width: 1, height: 1, rotation: 0 });
  const [masterSize, setMasterSize] = useState({ width: 1920, height: 1080 });
  const [mediaDimensions, setMediaDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [identifyMode, setIdentifyMode] = useState(true);
  const [identity, setIdentity] = useState<ClientIdentity | null>(null);
  const [clientRotation, setClientRotation] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const sock = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
    });

    sock.on('connect', () => {
      console.log('Client connected to server');
      setIsConnected(true);
      sock.emit('client-join', { viewport });
    });

    sock.on('disconnect', () => {
      setIsConnected(false);
    });

    sock.on('room-state', (data: {
      mediaUrl?: string;
      mediaType?: 'image' | 'video';
      layout?: Layout;
      isPlaying?: boolean;
      currentTime?: number;
      identifyMode?: boolean;
      identity?: ClientIdentity;
      canvasSize?: { width: number; height: number };
    }) => {
      if (data.mediaUrl) {
        setMediaUrl(data.mediaUrl);
        setMediaType(data.mediaType || null);
      }
      if (data.layout) {
        setLayout(data.layout);
      }
      if (data.isPlaying !== undefined) {
        setIsPlaying(data.isPlaying);
      }
      if (data.currentTime !== undefined && videoRef.current) {
        videoRef.current.currentTime = data.currentTime;
      }
      if (data.identifyMode !== undefined) {
        setIdentifyMode(data.identifyMode);
      }
      if (data.identity) {
        setIdentity(data.identity);
      }
      if (data.canvasSize) {
        setMasterSize(data.canvasSize);
      }
    });

    sock.on('layout-update', (data: LayoutUpdateType) => {
      setLayout({
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
        rotation: data.rotation,
      });
    });

    sock.on('media-update', (data: { url: string; type: 'image' | 'video' }) => {
      setMediaUrl(data.url);
      setMediaType(data.type);
    });

    sock.on('playback-update', (data: { isPlaying: boolean; currentTime?: number }) => {
      setIsPlaying(data.isPlaying);
      if (videoRef.current) {
        if (data.isPlaying) {
          videoRef.current.play().catch(console.error);
        } else {
          videoRef.current.pause();
        }
        if (data.currentTime !== undefined) {
          videoRef.current.currentTime = data.currentTime;
        }
      }
    });

    sock.on('mode-change', (data: ModeChange) => {
      setIdentifyMode(data.identifyMode);
    });

    sock.on('canvas-size-update', (data: { canvasSize: { width: number; height: number } }) => {
      setMasterSize(data.canvasSize);
    });

    // Handle window resize
    const handleResize = () => {
      const newViewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      sock.emit('client-join', { viewport: newViewport });
    };
    window.addEventListener('resize', handleResize);

    setSocket(sock);

    return () => {
      window.removeEventListener('resize', handleResize);
      sock.disconnect();
    };
  }, []);

  const handleRotate = () => {
    if (!socket) return;
    const newRotation = (clientRotation + 90) % 360;
    setClientRotation(newRotation);
    socket.emit('client-rotation-update', { rotation: newRotation });
  };

  // Handle media load to get actual dimensions
  const handleMediaLoad = () => {
    if (mediaType === 'video' && videoRef.current) {
      setMediaDimensions({
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      });
    } else if (mediaType === 'image' && imageRef.current) {
      setMediaDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
    }
  };

  // Calculate transform to show only the assigned region
  const getTransform = () => {
    if (!mediaUrl || !mediaDimensions) return {};

    const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
    const containerHeight = containerRef.current?.clientHeight || window.innerHeight;

    // The region we need to show (in master canvas coordinates)
    const regionX = layout.x;
    const regionY = layout.y;
    const regionWidth = layout.width;
    const regionHeight = layout.height;

    // Calculate scale factor between canvas coordinates and actual media dimensions
    const canvasToMediaScaleX = mediaDimensions.width / masterSize.width;
    const canvasToMediaScaleY = mediaDimensions.height / masterSize.height;
    
    // Convert region from canvas coordinates to media coordinates
    const mediaRegionX = regionX * canvasToMediaScaleX;
    const mediaRegionY = regionY * canvasToMediaScaleY;
    const mediaRegionWidth = regionWidth * canvasToMediaScaleX;
    const mediaRegionHeight = regionHeight * canvasToMediaScaleY;

    // Calculate the scale needed to fill the container with the region
    // We want the region to fill the entire container
    const scaleX = containerWidth / mediaRegionWidth;
    const scaleY = containerHeight / mediaRegionHeight;
    const scale = Math.max(scaleX, scaleY); // Use max to ensure we cover the entire container

    // Calculate translation to position the region correctly
    // The image/video is at full media dimensions, we need to translate it so the region is centered
    const centerX = mediaRegionX + mediaRegionWidth / 2;
    const centerY = mediaRegionY + mediaRegionHeight / 2;
    
    // Translate so that the center of the region aligns with the center of the container
    const translateX = containerWidth / 2 - centerX * scale;
    const translateY = containerHeight / 2 - centerY * scale;

    return {
      transform: `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${-layout.rotation}deg)`,
      transformOrigin: 'center center',
    };
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden"
      style={{ 
        touchAction: 'none',
        backgroundColor: identifyMode && identity ? identity.color : 'black',
        transform: `rotate(${clientRotation}deg)`,
        transformOrigin: 'center center',
      }}
    >
      {!isConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Connecting to host...</p>
          </div>
        </div>
      )}

      {isConnected && identifyMode && identity && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <div className="text-9xl font-bold drop-shadow-2xl" style={{ textShadow: '4px 4px 8px rgba(0,0,0,0.8)' }}>
            {identity.number}
          </div>
          <button
            onClick={handleRotate}
            className="mt-8 px-8 py-4 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-2xl font-semibold backdrop-blur-sm border-2 border-white border-opacity-50"
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
          >
            Rotate
          </button>
        </div>
      )}

      {isConnected && !identifyMode && !mediaUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <p className="text-xl mb-2">Waiting for media...</p>
            <p className="text-sm text-gray-400">The host will upload an image or video</p>
          </div>
        </div>
      )}

      {!identifyMode && mediaUrl && (
        <div className="absolute inset-0" style={getTransform()}>
          {mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              className="w-full h-full object-contain"
              playsInline
              muted
              loop
              onLoadedMetadata={handleMediaLoad}
            />
          ) : (
            <img
              ref={imageRef}
              src={mediaUrl}
              alt="Mosaic"
              className="w-full h-full object-contain"
              draggable={false}
              onLoad={handleMediaLoad}
            />
          )}
        </div>
      )}

      {/* Debug overlay (can be removed in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white text-xs p-2 rounded z-50">
          <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
          <div>Mode: {identifyMode ? 'Identify' : 'Live'}</div>
          {identity && (
            <>
              <div>ID: {identity.number}</div>
              <div>Color: {identity.color}</div>
            </>
          )}
          <div>Layout: x={layout.x.toFixed(0)}, y={layout.y.toFixed(0)}</div>
          <div>Size: {layout.width.toFixed(0)}x{layout.height.toFixed(0)}</div>
          <div>Rotation: {layout.rotation.toFixed(0)}°</div>
          <div>Client Rotation: {clientRotation}°</div>
        </div>
      )}
    </div>
  );
}

