export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text?: string;
  imageUrl?: string; // base64 data URI for user-uploaded image
  advice?: string; // AI-generated advice
  disclaimer?: string; // AI-generated disclaimer
  timestamp: Date;
  isLoading?: boolean; // For AI message while waiting for response
}
