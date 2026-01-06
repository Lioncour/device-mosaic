export interface ClientIdentity {
  color: string;
  number: number;
}

export interface ClientDevice {
  id: string;
  viewport: {
    width: number;
    height: number;
  };
  layout: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  };
  identity?: ClientIdentity;
  clientRotation?: number;
}

export interface RoomState {
  clients: Map<string, ClientDevice>;
  mediaUrl: string | null;
  mediaType: 'image' | 'video' | null;
  isPlaying: boolean;
  currentTime: number;
}

export interface LayoutUpdate {
  clientId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface MediaUpdate {
  url: string;
  type: 'image' | 'video';
}

export interface PlaybackUpdate {
  isPlaying: boolean;
  currentTime?: number;
}

export interface ModeChange {
  identifyMode: boolean;
}

export interface ClientRotationUpdate {
  rotation: number;
}



