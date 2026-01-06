# Distributed Video Wall

A web-based application that allows you to create a distributed video wall across multiple devices using Next.js, Tailwind CSS, and Socket.io.

## Features

- **Identify Mode**: Each client gets a unique high-contrast color and ID number for easy visual matching
- Upload images or videos on a Host device
- Connect multiple Client devices (phones/tablets)
- Arrange Client devices digitally to match physical layout
- Split video/image across all Client screens in real-time
- Synchronized playback control
- Client rotation support (rotate device UI 90 degrees)
- Proper image scaling based on actual media dimensions

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Host Device (Laptop/Desktop):**
   - Navigate to `/host` or click "Join as Host"
   - Wait for Client devices to connect (they'll appear with unique colors and ID numbers)
   - In **Identify Mode**: Match the colored boxes on screen to your physical devices
   - Drag and arrange the client rectangles to match your physical layout
   - Use the "Rotate" button on client devices if needed
   - Toggle to **Live Mode** when ready
   - Upload an image or video file
   - The media will be split across all client devices

2. **Client Devices (Phones/Tablets):**
   - Navigate to the same URL
   - Click "Join as Screen" or navigate to `/client`
   - In **Identify Mode**: See your unique color and ID number
   - Click "Rotate" to rotate the UI 90 degrees if needed
   - In **Live Mode**: The device will automatically display its portion of the video/image

## How It Works

- The Host manages a room and broadcasts layout updates
- Each Client reports its viewport dimensions
- The Host arranges clients on a virtual canvas
- Each Client renders the full source but zooms into its assigned region
- Layout updates are broadcast in real-time via Socket.io

## Technical Details

### Architecture

- **Server**: Custom Node.js server (`server.js`) that runs both Next.js and Socket.io
- **Host View**: React component with drag-and-drop calibration canvas
- **Client View**: React component that receives layout updates and transforms the media display
- **Real-time Communication**: Socket.io for bidirectional communication

### Key Features

1. **Identify Mode**: Unique colors and IDs for each client for easy visual matching
2. **Room Management**: Single room system (can be extended to multiple rooms)
3. **Layout Synchronization**: Real-time updates when host drags client rectangles
4. **Media Synchronization**: Video playback is synchronized across all clients
5. **Viewport Reporting**: Clients automatically report their screen dimensions
6. **Rotation Support**: Both host and client can rotate (host rotates layout, client rotates UI)
7. **Smart Scaling**: Images scale correctly based on actual media dimensions

### Calibration Workflow

1. Host uploads media (image or video)
2. Client devices connect and appear as draggable rectangles on the host canvas
3. Host physically arranges devices on a table/surface
4. Host drags the virtual rectangles to match the physical layout
5. Each client device automatically zooms to show only its assigned region
6. The result is a seamless mosaic across all devices

## Development

The project uses:
- **Next.js 14** for the React framework
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Socket.io** for real-time communication

## Deployment

### Railway (Recommended)

1. Create a Railway account at [railway.app](https://railway.app)
2. Create a new project and connect your GitHub repository
3. Railway will automatically detect the Node.js app and deploy it
4. Set the `PORT` environment variable (Railway provides this automatically)
5. Your app will be live at a Railway-provided URL

### Alternative: Render

1. Create a Render account at [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Set build command: `npm install && npm run build`
5. Set start command: `node server.js`
6. Deploy!

### Environment Variables

- `PORT`: Server port (defaults to 3000, Railway/Render set this automatically)
- `NODE_ENV`: Set to `production` in production

## Notes

- The default canvas size is 1920x1080, but can be adjusted in the Host view
- For production, consider using Redis or a database for room state persistence
- The current implementation uses a single room; extend to support multiple rooms if needed
- **Note**: GitHub Pages won't work for this app as it requires a Node.js server with Socket.IO

