

"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, Loader2, Info } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatMessageCard } from "@/components/chat-message";
import { ChatInputBar } from "@/components/chat-input-bar";
import { getAIResponse } from "./actions";
import type { ChatMessage } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth
import { useRouter } from 'next/navigation'; // Import useRouter
import { v4 as uuidv4 } from 'uuid'; // For generating conversation_id
import { supabase } from '@/lib/supabaseClient'; // Import supabase client
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const initialMessages: ChatMessage[] = [
  {
    id: uuidv4(), 
    role: 'ai',
    advice: 'Hello! I am MediMate AI. How can I assist you today?',
    suggestions: ["You can ask me about symptoms.", "Tell me about a health concern.", "Upload an image of a skin condition."],
    knowledgeCutoffAndSources: "My knowledge is based on a wide range of medical texts and research up to my last update. I draw on general medical understanding similar to that found in medical textbooks and reputable health information sources.",
    disclaimer: 'I am an AI assistant. My advice is not a substitute for professional medical consultation. Always consult a healthcare provider for medical concerns.',
    timestamp: new Date(),
  }
];

export default function MediMateAIChatPage() {
  const { user, isLoading: authLoading } = useAuth(); 
  const router = useRouter(); 

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSending, setIsSending] = useState(false); 
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
    if (user && !currentConversationId) {
      startNewConversation(false); // Don't clear messages on initial load if there are some
    }
  }, [user, authLoading, router, currentConversationId]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const startNewConversation = (clearOldMessages = true) => {
    const newConversationId = uuidv4();
    setCurrentConversationId(newConversationId);
    if (clearOldMessages) {
      setMessages([
        {
          id: uuidv4(),
          role: 'ai',
          advice: 'New chat started. How can I help you?',
          suggestions: ["Describe your symptoms.", "Ask about a medication (general info only)."],
          knowledgeCutoffAndSources: "My knowledge is based on a wide range of medical texts and research up to my last update. I draw on general medical understanding similar to that found in medical textbooks and reputable health information sources.",
          disclaimer: 'Remember, I am an AI. Always consult a professional.',
          timestamp: new Date(),
          conversationId: newConversationId,
        }
      ]);
    }
    // TODO: Save this new conversation record in a 'conversations' table if you add one.
    // TODO: Fetch existing conversations for this user for the sidebar.
  };

  const handleSendMessage = async (text: string, imageBase64?: string) => {
    if (!user || !currentConversationId) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to send messages." });
      return;
    }
    setIsSending(true);
    const userMessageId = uuidv4();
    const userMessageTimestamp = new Date();
    
    const currentUserMessages = messages.filter(msg => msg.conversationId === currentConversationId);

    const newUserMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      text: text,
      imageUrl: imageBase64,
      timestamp: userMessageTimestamp,
      userId: user.id,
      conversationId: currentConversationId,
    };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);

    const { error: insertError } = await supabase.from('messages').insert({
      conversation_id: currentConversationId,
      user_id: user.id,
      sender: 'user',
      content: text,
      image_url: imageBase64,
    });

    if (insertError) {
      console.error("Error saving user message:", insertError);
      toast({ variant: "destructive", title: "Save Error", description: "Could not save your message: " + insertError.message });
      setMessages(prev => prev.filter(m => m.id !== userMessageId));
      setIsSending(false);
      return;
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

    try {
      // TODO: When ready, pass conversation history to getAIResponse
      // const historyToPass = currentUserMessages
      //   .filter(msg => !msg.isLoading && (msg.text || msg.advice))
      //   .map(msg => ({
      //     role: msg.role,
      //     content: msg.text || msg.advice || '',
      //   }));

      const aiResponse = await getAIResponse(text, imageBase64 /*, historyToPass */);
      const aiResponseTimestamp = new Date();

      if ('error' in aiResponse) {
        setMessages((prevMessages) =>
          prevMessages.map(msg => 
            msg.id === aiLoadingMessageId 
            ? { 
                ...msg, 
                role: 'ai', 
                advice: `Error: ${aiResponse.error}`, 
                disclaimer: "Please try again.", 
                isLoading: false, 
                timestamp: aiResponseTimestamp, 
                conversationId: currentConversationId 
              } 
            : msg
          )
        );
        toast({
          variant: "destructive",
          title: "AI Error",
          description: aiResponse.error,
        });
      } else {
         setMessages((prevMessages) =>
          prevMessages.map(msg => 
            msg.id === aiLoadingMessageId 
            ? { 
                ...msg, 
                role: 'ai', 
                advice: aiResponse.advice, 
                suggestions: aiResponse.suggestions,
                knowledgeCutoffAndSources: aiResponse.knowledgeCutoffAndSources,
                disclaimer: aiResponse.disclaimer, 
                isLoading: false, 
                timestamp: aiResponseTimestamp, 
                conversationId: currentConversationId 
              } 
            : msg
          )
        );
        // TODO: Save AI message to Supabase. This requires backend logic or adjusted RLS
        // For now, AI messages are only in local state.
        // Consider creating an Edge Function for this.
      }
    } catch (error) {
      console.error("Failed to get AI response:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      setMessages((prevMessages) =>
        prevMessages.map(msg => 
          msg.id === aiLoadingMessageId 
          ? { 
              ...msg, 
              role: 'ai', 
              advice: `Error: ${errorMessage}`, 
              disclaimer: "Please try again.", 
              isLoading: false, 
              timestamp: new Date(), 
              conversationId: currentConversationId 
            } 
          : msg
        )
      );
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to communicate with AI. " + errorMessage,
      });
    } finally {
      setIsSending(false);
    }
  };

  if (authLoading || (!user && router.pathname !== '/auth')) { 
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
        </ScrollArea>

        <ChatInputBar onSubmit={handleSendMessage} isLoading={isSending} />

        <ChatSidebar 
          isOpen={isSidebarOpen} 
          onClose={toggleSidebar} 
          onNewChat={() => startNewConversation(true)} 
          // TODO: Pass actual chat history data and handler for loading chats
        />
      </div>
    </TooltipProvider>
  );
}

