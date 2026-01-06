# Distributed Video Wall

A web-based application that allows you to create a distributed video wall across multiple devices using Next.js, Tailwind CSS, and Socket.io.

## Features

- Upload images or videos on a Host device
- Connect multiple Client devices (phones/tablets)
- Arrange Client devices digitally to match physical layout
- Split video/image across all Client screens in real-time
- Synchronized playback control

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
   - Upload an image or video file
   - Wait for Client devices to connect
   - Drag and arrange the client rectangles to match your physical layout

2. **Client Devices (Phones/Tablets):**
   - Navigate to the same URL
   - Click "Join as Screen" or navigate to `/client`
   - The device will automatically connect and display its portion of the video/image

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

1. **Room Management**: Single room system (can be extended to multiple rooms)
2. **Layout Synchronization**: Real-time updates when host drags client rectangles
3. **Media Synchronization**: Video playback is synchronized across all clients
4. **Viewport Reporting**: Clients automatically report their screen dimensions
5. **Rotation Support**: Host can rotate client rectangles to match physical device orientation

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

## Notes

- The default canvas size is 1920x1080, but can be adjusted in the Host view
- For production, consider using Redis or a database for room state persistence
- The current implementation uses a single room; extend to support multiple rooms if needed

