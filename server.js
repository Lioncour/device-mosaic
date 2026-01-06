const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store room state (in production, use Redis or a database)
const rooms = new Map();

// High-contrast colors for identify mode
const IDENTIFY_COLORS = [
  '#00FF00', // Neon Green
  '#FF1493', // Hot Pink
  '#00FFFF', // Cyan
  '#FFD700', // Gold
  '#FF4500', // Orange Red
  '#8A2BE2', // Blue Violet
  '#FF00FF', // Magenta
  '#00CED1', // Dark Turquoise
  '#FF6347', // Tomato
  '#32CD32', // Lime Green
  '#FF69B4', // Hot Pink (variant)
  '#1E90FF', // Dodger Blue
];

let nextClientId = 1;

const getOrCreateRoom = (roomId) => {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      clients: new Map(),
      mediaUrl: null,
      mediaType: null,
      isPlaying: false,
      currentTime: 0,
      identifyMode: true, // Start in identify mode
      canvasSize: { width: 1920, height: 1080 }, // Default canvas size
    });
  }
  return rooms.get(roomId);
};

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    path: '/api/socket',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    const roomId = 'default'; // For simplicity, using a single room
    const room = getOrCreateRoom(roomId);

    console.log(`Client connected: ${socket.id}`);

    // Handle client joining as a screen
    socket.on('client-join', (data) => {
      // Join the room to receive broadcasts
      socket.join(roomId);
      
      // Assign unique color and ID
      const colorIndex = (nextClientId - 1) % IDENTIFY_COLORS.length;
      const clientColor = IDENTIFY_COLORS[colorIndex];
      const clientNumber = nextClientId++;
      
      const clientDevice = {
        id: socket.id,
        viewport: data.viewport,
        layout: {
          x: 0,
          y: 0,
          width: 200,
          height: 200,
          rotation: 0,
        },
        identity: {
          color: clientColor,
          number: clientNumber,
        },
        clientRotation: 0, // Rotation state from client
      };

      room.clients.set(socket.id, clientDevice);

      // Notify host about new client
      socket.to(roomId).emit('client-connected', {
        clientId: socket.id,
        viewport: data.viewport,
        identity: clientDevice.identity,
      });

      // Send current room state to new client
      socket.emit('room-state', {
        mediaUrl: room.mediaUrl,
        mediaType: room.mediaType,
        layout: clientDevice.layout,
        isPlaying: room.isPlaying,
        currentTime: room.currentTime,
        identifyMode: room.identifyMode,
        identity: clientDevice.identity,
        canvasSize: room.canvasSize,
      });

      // Send all clients to host
      io.to(roomId).emit('clients-update', {
        clients: Array.from(room.clients.values()),
      });
    });

    // Handle host joining
    socket.on('host-join', () => {
      socket.join(roomId);
      socket.emit('room-state', {
        clients: Array.from(room.clients.values()),
        mediaUrl: room.mediaUrl,
        mediaType: room.mediaType,
        identifyMode: room.identifyMode,
        canvasSize: room.canvasSize,
      });
    });

    // Handle canvas size update from host
    socket.on('canvas-size-update', (data) => {
      room.canvasSize = data.canvasSize;
      
      // Broadcast to all clients
      io.to(roomId).emit('canvas-size-update', {
        canvasSize: data.canvasSize,
      });
    });

    // Handle layout updates from host
    socket.on('layout-update', (data) => {
      const client = room.clients.get(data.clientId);
      if (client) {
        client.layout = {
          x: data.x,
          y: data.y,
          width: data.width,
          height: data.height,
          rotation: data.rotation,
        };

        // Broadcast to specific client
        io.to(data.clientId).emit('layout-update', {
          x: data.x,
          y: data.y,
          width: data.width,
          height: data.height,
          rotation: data.rotation,
        });

        // Broadcast to all hosts
        socket.to(roomId).emit('clients-update', {
          clients: Array.from(room.clients.values()),
        });
      }
    });

    // Handle media upload from host
    socket.on('media-update', (data) => {
      room.mediaUrl = data.url;
      room.mediaType = data.type;

      // Broadcast to all clients
      io.to(roomId).emit('media-update', data);
    });

    // Handle playback control from host
    socket.on('playback-update', (data) => {
      room.isPlaying = data.isPlaying;
      if (data.currentTime !== undefined) {
        room.currentTime = data.currentTime;
      }

      // Broadcast to all clients
      io.to(roomId).emit('playback-update', data);
    });

    // Handle mode toggle from host
    socket.on('mode-toggle', (data) => {
      room.identifyMode = data.identifyMode;
      
      // Broadcast mode change to all clients and hosts
      io.to(roomId).emit('mode-change', {
        identifyMode: data.identifyMode,
      });
    });

    // Handle client rotation update
    socket.on('client-rotation-update', (data) => {
      const client = room.clients.get(socket.id);
      if (client) {
        client.clientRotation = data.rotation;
        
        // Notify host about rotation change
        socket.to(roomId).emit('client-rotation-update', {
          clientId: socket.id,
          rotation: data.rotation,
        });
        
        // Update all hosts
        io.to(roomId).emit('clients-update', {
          clients: Array.from(room.clients.values()),
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      room.clients.delete(socket.id);

      // Notify host
      socket.to(roomId).emit('client-disconnected', {
        clientId: socket.id,
      });

      // Update all hosts
      io.to(roomId).emit('clients-update', {
        clients: Array.from(room.clients.values()),
      });
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});

