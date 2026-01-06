'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { ClientDevice, ClientIdentity, ModeChange } from '@/types/socket';
import { io, Socket } from 'socket.io-client';

interface DraggableClient {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  viewport: { width: number; height: number };
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  identity?: ClientIdentity;
  clientRotation?: number;
}

export default function HostView() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [clients, setClients] = useState<Map<string, DraggableClient>>(new Map());
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [identifyMode, setIdentifyMode] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  useEffect(() => {
    const sock = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
    });

    sock.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      sock.emit('host-join');
    });

    sock.on('disconnect', () => {
      setIsConnected(false);
    });

    sock.on('room-state', (data: { clients?: ClientDevice[]; mediaUrl?: string; mediaType?: 'image' | 'video'; identifyMode?: boolean; canvasSize?: { width: number; height: number } }) => {
      if (data.clients) {
        const clientsMap = new Map<string, DraggableClient>();
        data.clients.forEach((client) => {
          clientsMap.set(client.id, {
            id: client.id,
            x: client.layout.x,
            y: client.layout.y,
            width: client.layout.width,
            height: client.layout.height,
            rotation: client.layout.rotation,
            viewport: client.viewport,
            isDragging: false,
            dragOffset: { x: 0, y: 0 },
            identity: client.identity,
            clientRotation: client.clientRotation,
          });
        });
        setClients(clientsMap);
      }
      if (data.mediaUrl) {
        setMediaUrl(data.mediaUrl);
        setMediaType(data.mediaType || null);
      }
      if (data.identifyMode !== undefined) {
        setIdentifyMode(data.identifyMode);
      }
      if (data.canvasSize) {
        setCanvasSize(data.canvasSize);
      }
    });

    sock.on('client-connected', (data: { clientId: string; viewport: { width: number; height: number }; identity?: ClientIdentity }) => {
      const newClient: DraggableClient = {
        id: data.clientId,
        x: Math.random() * (canvasSize.width - 200),
        y: Math.random() * (canvasSize.height - 200),
        width: 200,
        height: (data.viewport.height / data.viewport.width) * 200,
        rotation: 0,
        viewport: data.viewport,
        isDragging: false,
        dragOffset: { x: 0, y: 0 },
        identity: data.identity,
        clientRotation: 0,
      };
      setClients((prev) => {
        const next = new Map(prev);
        next.set(data.clientId, newClient);
        return next;
      });

      // Send initial layout
      sock.emit('layout-update', {
        clientId: data.clientId,
        x: newClient.x,
        y: newClient.y,
        width: newClient.width,
        height: newClient.height,
        rotation: newClient.rotation,
      });
    });

    sock.on('clients-update', (data: { clients: ClientDevice[] }) => {
      const clientsMap = new Map<string, DraggableClient>();
      data.clients.forEach((client) => {
        const existing = clients.get(client.id);
        clientsMap.set(client.id, {
          id: client.id,
          x: client.layout.x,
          y: client.layout.y,
          width: client.layout.width,
          height: client.layout.height,
          rotation: client.layout.rotation,
          viewport: client.viewport,
          isDragging: existing?.isDragging || false,
          dragOffset: existing?.dragOffset || { x: 0, y: 0 },
          identity: client.identity,
          clientRotation: client.clientRotation,
        });
      });
      setClients(clientsMap);
    });

    sock.on('mode-change', (data: ModeChange) => {
      setIdentifyMode(data.identifyMode);
    });

    sock.on('client-rotation-update', (data: { clientId: string; rotation: number }) => {
      setClients((prev) => {
        const next = new Map(prev);
        const client = next.get(data.clientId);
        if (client) {
          next.set(data.clientId, { ...client, clientRotation: data.rotation });
        }
        return next;
      });
    });

    sock.on('client-disconnected', (data: { clientId: string }) => {
      setClients((prev) => {
        const next = new Map(prev);
        next.delete(data.clientId);
        return next;
      });
    });

    setSocket(sock);

    return () => {
      sock.disconnect();
    };
  }, []);

  // Send canvas size updates when socket is ready
  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('canvas-size-update', { canvasSize });
    }
  }, [socket, isConnected, canvasSize]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socket) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setMediaUrl(url);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');

      socket.emit('media-update', {
        url,
        type: file.type.startsWith('video/') ? 'video' : 'image',
      });
    };
    reader.readAsDataURL(file);
  }, [socket]);

  const handleMouseDown = useCallback((e: React.MouseEvent, clientId: string) => {
    e.preventDefault();
    const client = clients.get(clientId);
    if (!client || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    // Calculate the position of the client rectangle in screen coordinates
    const clientScreenX = (client.x / canvasSize.width) * rect.width + rect.left;
    const clientScreenY = (client.y / canvasSize.height) * rect.height + rect.top;
    
    // Calculate offset from mouse to top-left corner of client rectangle
    const offsetX = e.clientX - clientScreenX;
    const offsetY = e.clientY - clientScreenY;

    setClients((prev) => {
      const next = new Map(prev);
      const updated = { ...client, isDragging: true, dragOffset: { x: offsetX, y: offsetY } };
      next.set(clientId, updated);
      return next;
    });
    setSelectedClientId(clientId);
  }, [clients, canvasSize]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!selectedClientId || !canvasRef.current || !socket) return;

    const client = clients.get(selectedClientId);
    if (!client || !client.isDragging) return;

    const rect = canvasRef.current.getBoundingClientRect();
    // Convert screen coordinates to canvas coordinates
    const mouseCanvasX = ((e.clientX - rect.left - client.dragOffset.x) / rect.width) * canvasSize.width;
    const mouseCanvasY = ((e.clientY - rect.top - client.dragOffset.y) / rect.height) * canvasSize.height;
    
    const newX = Math.max(0, Math.min(canvasSize.width - client.width, mouseCanvasX));
    const newY = Math.max(0, Math.min(canvasSize.height - client.height, mouseCanvasY));

    setClients((prev) => {
      const next = new Map(prev);
      const updated = { ...client, x: newX, y: newY };
      next.set(selectedClientId, updated);
      return next;
    });

    // Emit layout update
    socket.emit('layout-update', {
      clientId: selectedClientId,
      x: newX,
      y: newY,
      width: client.width,
      height: client.height,
      rotation: client.rotation,
    });
  }, [selectedClientId, clients, canvasSize, socket]);

  const handleMouseUp = useCallback(() => {
    if (selectedClientId) {
      setClients((prev) => {
        const next = new Map(prev);
        const client = next.get(selectedClientId);
        if (client) {
          next.set(selectedClientId, { ...client, isDragging: false });
        }
        return next;
      });
    }
    setSelectedClientId(null);
  }, [selectedClientId]);

  const handleRotate = useCallback((clientId: string, delta: number) => {
    if (!socket) return;
    const client = clients.get(clientId);
    if (!client) return;

    const newRotation = (client.rotation + delta) % 360;
    setClients((prev) => {
      const next = new Map(prev);
      next.set(clientId, { ...client, rotation: newRotation });
      return next;
    });

    socket.emit('layout-update', {
      clientId,
      x: client.x,
      y: client.y,
      width: client.width,
      height: client.height,
      rotation: newRotation,
    });
  }, [clients, socket]);

  const handleModeToggle = useCallback(() => {
    if (!socket) return;
    const newMode = !identifyMode;
    setIdentifyMode(newMode);
    socket.emit('mode-toggle', { identifyMode: newMode });
  }, [socket, identifyMode]);


  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Host Control Panel</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handleModeToggle}
              className={`px-6 py-2 rounded-lg font-semibold ${
                identifyMode
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {identifyMode ? 'Identify Mode' : 'Live Mode'}
            </button>
            <div className={`px-4 py-2 rounded ${isConnected ? 'bg-green-600' : 'bg-red-600'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            <div className="text-sm">
              {clients.size} client{clients.size !== 1 ? 's' : ''} connected
            </div>
          </div>
        </div>

        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
          >
            Upload Image/Video
          </button>
        </div>

        {mediaUrl && (
          <div className="mb-4 p-4 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Preview</h2>
            {mediaType === 'video' ? (
              <video
                src={mediaUrl}
                controls
                className="max-w-full max-h-64 rounded"
                onPlay={() => socket?.emit('playback-update', { isPlaying: true })}
                onPause={() => socket?.emit('playback-update', { isPlaying: false })}
                onTimeUpdate={(e) => {
                  const video = e.currentTarget;
                  socket?.emit('playback-update', {
                    isPlaying: !video.paused,
                    currentTime: video.currentTime,
                  });
                }}
              />
            ) : (
              <img src={mediaUrl} alt="Preview" className="max-w-full max-h-64 rounded" />
            )}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Calibration Canvas</h2>
          <div className="mb-2 flex gap-2">
            <label className="flex items-center gap-2">
              Width:
              <input
                type="number"
                value={canvasSize.width}
                onChange={(e) => {
                  const newSize = { ...canvasSize, width: parseInt(e.target.value) || 1920 };
                  setCanvasSize(newSize);
                  if (socket) {
                    socket.emit('canvas-size-update', { canvasSize: newSize });
                  }
                }}
                className="px-2 py-1 bg-gray-700 rounded text-white w-24"
              />
            </label>
            <label className="flex items-center gap-2">
              Height:
              <input
                type="number"
                value={canvasSize.height}
                onChange={(e) => {
                  const newSize = { ...canvasSize, height: parseInt(e.target.value) || 1080 };
                  setCanvasSize(newSize);
                  if (socket) {
                    socket.emit('canvas-size-update', { canvasSize: newSize });
                  }
                }}
                className="px-2 py-1 bg-gray-700 rounded text-white w-24"
              />
            </label>
          </div>
          <div
            ref={canvasRef}
            className="relative bg-gray-700 border-2 border-gray-600 rounded-lg overflow-hidden"
            style={{ width: '100%', height: '600px', maxWidth: '100%' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {mediaUrl && (
              <div
                className="absolute inset-0 bg-cover bg-center opacity-20"
                style={{
                  backgroundImage: `url(${mediaUrl})`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                }}
              />
            )}
            {Array.from(clients.values()).map((client) => (
              <div
                key={client.id}
                className={`absolute border-2 cursor-move ${
                  selectedClientId === client.id ? 'border-blue-500' : identifyMode && client.identity ? 'border-white border-opacity-50' : 'border-green-500'
                }`}
                style={{
                  left: `${(client.x / canvasSize.width) * 100}%`,
                  top: `${(client.y / canvasSize.height) * 100}%`,
                  width: `${(client.width / canvasSize.width) * 100}%`,
                  height: `${(client.height / canvasSize.height) * 100}%`,
                  transform: `rotate(${client.rotation}deg)`,
                  transformOrigin: 'center center',
                  backgroundColor: identifyMode && client.identity ? client.identity.color : selectedClientId === client.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(34, 197, 94, 0.1)',
                }}
                onMouseDown={(e) => handleMouseDown(e, client.id)}
              >
                {identifyMode && client.identity && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-4xl font-bold text-white drop-shadow-2xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                      {client.identity.number}
                    </div>
                  </div>
                )}
                <div className="absolute -top-6 left-0 text-xs bg-gray-900 px-2 py-1 rounded whitespace-nowrap">
                  {client.viewport.width}x{client.viewport.height}
                </div>
                {!identifyMode && (
                  <div className="absolute -bottom-6 left-0 flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRotate(client.id, -15);
                      }}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                    >
                      ↺
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRotate(client.id, 15);
                      }}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                    >
                      ↻
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

