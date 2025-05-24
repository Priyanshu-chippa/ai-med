
"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatMessageCard } from "@/components/chat-message";
import { ChatInputBar } from "@/components/chat-input-bar";
import { getAIResponse } from "./actions";
import type { ChatMessage, ConversationPreview } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabaseClient';
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import type { Tables } from '@/types/supabase';

const createInitialAIMessage = (conversationId: string): ChatMessage => ({
  id: uuidv4(), 
  role: 'ai',
  advice: 'Hello! I am MediMate AI. How can I assist you today?',
  suggestions: ["You can ask me about symptoms.", "Tell me about a health concern.", "Upload an image of a skin condition."],
  knowledgeCutoffAndSources: "My knowledge is based on a wide range of medical texts and research up to my last update. I draw on general medical understanding similar to that found in medical textbooks and reputable health information sources.",
  disclaimer: 'I am an AI assistant. My advice is not a substitute for professional medical consultation. Always consult a healthcare provider for medical concerns.',
  timestamp: new Date(),
  conversationId: conversationId,
  content: JSON.stringify({
    advice: 'Hello! I am MediMate AI. How can I assist you today?',
    suggestions: ["You can ask me about symptoms.", "Tell me about a health concern.", "Upload an image of a skin condition."],
    knowledgeCutoffAndSources: "My knowledge is based on a wide range of medical texts and research up to my last update. I draw on general medical understanding similar to that found in medical textbooks and reputable health information sources.",
    disclaimer: 'I am an AI assistant. My advice is not a substitute for professional medical consultation. Always consult a healthcare provider for medical concerns.',
  }),
});

export default function Page() {
  const { user, isLoading: authLoading } = useAuth(); 
  const router = useRouter(); 

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSending, setIsSending] = useState(false); 
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatHistoryList, setChatHistoryList] = useState<ConversationPreview[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const fetchChatHistory = useCallback(async () => {
    if (!user) return;
    setIsSending(true); 
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('conversation_id, content, created_at, sender, user_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const conversationsMap = new Map<string, { title: string; lastActivity: string; messageCount: number; firstUserMessageContent?: string, firstMessageTimestamp?: string }>();
        const userConversationIds = new Set<string>();
        data.forEach(msg => {
            if (msg.user_id === user.id && msg.conversation_id) {
                userConversationIds.add(msg.conversation_id);
            }
        });
        
        const allMessagesForUserConversations: Tables<'messages'>[] = [];
        if (userConversationIds.size > 0) {
            const { data: fullConvoData, error: fullConvoError } = await supabase
                .from('messages')
                .select('conversation_id, content, created_at, sender, user_id, image_url') // Ensure image_url is selected
                .in('conversation_id', Array.from(userConversationIds))
                .order('created_at', { ascending: true });
            if (fullConvoError) throw fullConvoError;
            if (fullConvoData) allMessagesForUserConversations.push(...fullConvoData);
        }

        allMessagesForUserConversations.forEach(msg => {
          if (!msg.conversation_id) return;
          let convo = conversationsMap.get(msg.conversation_id);
          if (!convo) {
            convo = { title: '', lastActivity: msg.created_at, messageCount: 0 };
            conversationsMap.set(msg.conversation_id, convo);
          }
          convo.lastActivity = msg.created_at > convo.lastActivity ? msg.created_at : convo.lastActivity;
          convo.messageCount++;
          if (!convo.firstUserMessageContent && msg.sender === 'user' && msg.content) {
            convo.firstUserMessageContent = msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '');
            convo.firstMessageTimestamp = msg.created_at;
          }
        });
        
        const previews: ConversationPreview[] = Array.from(conversationsMap.entries()).map(([id, convoData]) => ({
          id,
          title: convoData.firstUserMessageContent || `Chat from ${new Date(convoData.firstMessageTimestamp || convoData.lastActivity).toLocaleDateString()}`,
          lastActivity: convoData.lastActivity,
          messageCount: convoData.messageCount,
        })).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
        
        setChatHistoryList(previews);

        if (previews.length > 0 && (!currentConversationId || !previews.find(p => p.id === currentConversationId))) {
           if (!currentConversationId) loadConversation(previews[0].id);
        } else if (previews.length === 0 && !currentConversationId) {
          startNewConversation(false); 
        }
      }
    } catch (error: any) {
      console.error("Error fetching chat history:", error);
      toast({ variant: "destructive", title: "History Error", description: "Could not load chat history: " + error.message });
      if (!currentConversationId) startNewConversation(false); 
    } finally {
      setIsSending(false);
    }
  }, [user, toast, currentConversationId]); // Added currentConversationId back for specific scenario

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
    if (user && chatHistoryList.length === 0 && !currentConversationId) { 
      fetchChatHistory();
    }
  }, [user, authLoading, router, fetchChatHistory, chatHistoryList.length, currentConversationId]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const loadConversation = useCallback(async (conversationId: string) => {
    if (!user) return;
    setIsSending(true);
    setCurrentConversationId(conversationId);
    setMessages([]); 

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*') // Selects all columns, including image_url
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const loadedMessages: ChatMessage[] = data.map((dbMsg: Tables<'messages'>) => {
        const baseMessage: ChatMessage = {
          id: dbMsg.id.toString(),
          supabase_id: dbMsg.id,
          role: dbMsg.sender as 'user' | 'ai',
          timestamp: new Date(dbMsg.created_at),
          conversationId: dbMsg.conversation_id,
          userId: dbMsg.user_id || undefined,
          content: dbMsg.content, // Keep raw content for parsing/display
        };

        if (dbMsg.sender === 'ai') {
          if (dbMsg.content) {
            try {
              const aiContent = JSON.parse(dbMsg.content);
              return {
                ...baseMessage,
                advice: aiContent.advice || "AI response data is incomplete.",
                suggestions: aiContent.suggestions || [],
                knowledgeCutoffAndSources: aiContent.knowledgeCutoffAndSources || "Knowledge source not specified.",
                disclaimer: aiContent.disclaimer || "Please consult a professional.",
              };
            } catch (e) {
              console.error("Error parsing AI message content:", e, "Raw content:", dbMsg.content);
              return { 
                ...baseMessage, 
                advice: "Error: AI response from database is malformed.",
              };
            }
          } else {
            return { 
              ...baseMessage, 
              advice: "Error: AI response content is missing from database.",
            };
          }
        }
        // For user messages
        return { 
          ...baseMessage, 
          text: dbMsg.content || "", // User message text
          imageUrl: dbMsg.image_url || undefined // User image URL
        };
      });
      setMessages(loadedMessages);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Load Error", description: "Could not load conversation: " + error.message });
    } finally {
      setIsSending(false);
    }
    setIsSidebarOpen(false);
  }, [user, toast]);

  const startNewConversation = useCallback((clearOldMessages = true) => {
    const newConversationId = uuidv4();
    setCurrentConversationId(newConversationId);
    if (clearOldMessages) {
      setMessages([createInitialAIMessage(newConversationId)]);
    } else {
      // If not clearing, maybe we just want to set the ID for the next message
      // but the current UI flow expects messages to be cleared or an initial message to be set.
      // For now, always start with an initial AI message.
       setMessages([createInitialAIMessage(newConversationId)]);
    }
    setIsSidebarOpen(false);
  }, []);


  const handleSendMessage = async (text: string, imageBase64?: string) => {
    if (!user || !currentConversationId) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in and in a conversation to send messages." });
      if (!currentConversationId) startNewConversation(); // Start a new one if ID is missing
      return;
    }
    setIsSending(true);
    const userMessageIdClient = uuidv4(); 
    
    const newUserMessage: ChatMessage = {
      id: userMessageIdClient,
      role: 'user',
      text: text,
      imageUrl: imageBase64,
      timestamp: new Date(),
      userId: user.id,
      conversationId: currentConversationId,
      content: text,
    };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);

    try {
      const { data: insertedMessage, error: insertError } = await supabase.from('messages').insert({
        conversation_id: currentConversationId,
        user_id: user.id,
        sender: 'user',
        content: text,
        image_url: imageBase64,
      }).select().single();

      if (insertError) throw insertError;

      if (insertedMessage) {
        setMessages(prev => prev.map(m => m.id === userMessageIdClient ? {...m, id: insertedMessage.id.toString(), supabase_id: insertedMessage.id} : m));
      }
      
      const isNewConversationInList = !chatHistoryList.find(c => c.id === currentConversationId);
      if (isNewConversationInList) {
          await fetchChatHistory(); 
      }

      const aiLoadingMessageId = uuidv4();
      const aiLoadingMessage: ChatMessage = {
        id: aiLoadingMessageId,
        role: 'ai',
        isLoading: true,
        timestamp: new Date(),
        conversationId: currentConversationId,
      };
      setMessages((prevMessages) => [...prevMessages, aiLoadingMessage]);

      const aiResponse = await getAIResponse(text, imageBase64);

      if ('error' in aiResponse || !aiResponse.advice) { // Ensure advice is present
        throw new Error('error' in aiResponse ? aiResponse.error : "AI response was invalid.");
      }
      
      const { data: savedAiMsg, error: saveAiError } = await supabase.functions.invoke('save-ai-message', {
        body: {
          conversation_id: currentConversationId,
          user_id: user.id, 
          ai_response: aiResponse, 
        }
      });

      if (saveAiError) {
        console.error("Error saving AI message via function:", saveAiError);
        toast({ variant: "destructive", title: "Save Error", description: "AI response shown, but failed to save to history: " + saveAiError.message});
      }
      
      const aiMessageToDisplay: ChatMessage = {
        id: savedAiMsg?.data?.id?.toString() || uuidv4(), 
        supabase_id: savedAiMsg?.data?.id,
        role: 'ai',
        advice: aiResponse.advice,
        suggestions: aiResponse.suggestions,
        knowledgeCutoffAndSources: aiResponse.knowledgeCutoffAndSources,
        disclaimer: aiResponse.disclaimer,
        timestamp: new Date(),
        conversationId: currentConversationId,
        content: JSON.stringify(aiResponse), 
      };

      setMessages((prevMessages) =>
        prevMessages.map(msg => msg.id === aiLoadingMessageId ? aiMessageToDisplay : msg)
      );

    } catch (error: any) {
      console.error("Error in handleSendMessage:", error);
      const errorMessage = error.message || "An unexpected error occurred.";
      setMessages((prevMessages) => {
        const loadingMsgId = prevMessages.find(m => m.isLoading)?.id || '';
        return prevMessages.map(msg => 
          msg.id === loadingMsgId
          ? { 
              ...msg, 
              role: 'ai', 
              advice: `Error: ${errorMessage}`, 
              disclaimer: "Please try again.", 
              isLoading: false, 
              timestamp: new Date(), 
              conversationId: currentConversationId,
              content: JSON.stringify({error: errorMessage, advice: `Error: ${errorMessage}`, disclaimer: "Please try again."}),
            } 
          : msg
        )
      });
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process message. " + errorMessage,
      });
    } finally {
      setIsSending(false);
      if (currentConversationId && chatHistoryList.find(c => c.id === currentConversationId)) {
        setChatHistoryList(prev => 
            prev.map(c => c.id === currentConversationId ? {...c, lastActivity: new Date().toISOString()} : c)
            .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
        );
      } else if (currentConversationId) { 
          await fetchChatHistory();
      }
    }
  };

  useEffect(() => {
    // Ensure initial message is set if starting fresh and no history loaded yet
    if (user && !currentConversationId && messages.length === 0 && !authLoading && chatHistoryList.length === 0) {
      startNewConversation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentConversationId, messages.length, authLoading, chatHistoryList.length]);


  if (authLoading && !user) { 
    return (
      <div className="flex flex-col h-screen bg-background text-foreground items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading MediMate AI...</p>
      </div>
    );
  }
  
  if (!user) return null; 

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-background text-foreground">
        <header className="sticky top-0 z-10 flex items-center justify-between p-3 md:p-4 border-b bg-background shadow-sm">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Toggle menu">
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-primary">
            MediMate AI
          </h1>
          <ThemeToggle />
        </header>

        <ScrollArea className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <ChatMessageCard key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
          {isSending && messages.length === 0 && currentConversationId && ( 
             <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          )}
        </ScrollArea>

        <ChatInputBar onSubmit={handleSendMessage} isLoading={isSending} />

        <ChatSidebar 
          isOpen={isSidebarOpen} 
          onClose={toggleSidebar} 
          onNewChat={() => startNewConversation(true)}
          conversations={chatHistoryList}
          onLoadConversation={loadConversation}
          activeConversationId={currentConversationId}
        />
      </div>
    </TooltipProvider>
  );
}
