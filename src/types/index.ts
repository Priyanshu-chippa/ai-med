
export interface ChatMessage {
  id: string; // Client-side UUID for React key and local state management
  supabase_id?: number; // Optional: Supabase 'id' (bigint) if fetched from DB
  role: 'user' | 'ai';
  text?: string;
  imageUrl?: string; // base64 data URI for user-uploaded image
  advice?: string; // AI-generated advice
  disclaimer?: string; // AI-generated disclaimer
  timestamp: Date;
  isLoading?: boolean; // For AI message while waiting for response
  
  // Fields to align with Supabase 'messages' table
  conversationId?: string; // Corresponds to 'conversation_id' (uuid)
  userId?: string; // Corresponds to 'user_id' (uuid) - for user messages
}
