
export interface ChatMessage {
  id: string; // Client-side UUID for React key and local state management
  supabase_id?: number; // Optional: Supabase 'id' (bigint) if fetched from DB
  role: 'user' | 'ai';
  text?: string; // For user messages
  imageUrl?: string; // base64 data URI for user-uploaded image
  
  // Fields for AI messages (parsed from Supabase content JSON)
  advice?: string; 
  suggestions?: string[];
  knowledgeCutoffAndSources?: string;
  disclaimer?: string;
  
  // Raw content from Supabase (for AI messages, this is stringified JSON)
  content?: string | null; 

  timestamp: Date;
  isLoading?: boolean; // For AI message while waiting for response
  
  conversationId?: string; 
  userId?: string; 
}

export interface ConversationPreview {
  id: string; // conversation_id
  title: string;
  lastActivity: string; // ISO date string for sorting and display
  messageCount: number;
}
