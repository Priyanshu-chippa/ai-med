"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatMessageCard } from "@/components/chat-message";
import { ChatInputBar } from "@/components/chat-input-bar";
import { getAIResponse } from "./actions";
import type { ChatMessage } from "@/types";
import { useToast } from "@/hooks/use-toast";

const initialMessages: ChatMessage[] = [
  {
    id: '0',
    role: 'ai',
    advice: 'Hello! I am MediMate AI. How can I assist you today?',
    disclaimer: 'I am an AI assistant. My advice is not a substitute for professional medical consultation. Always consult a healthcare provider for medical concerns.',
    timestamp: new Date(),
  }
];

export default function MediMateAIChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleSendMessage = async (text: string, imageBase64?: string) => {
    setIsLoading(true);
    const userMessageId = Date.now().toString();
    const newUserMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      text: text,
      imageUrl: imageBase64,
      timestamp: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);

    const aiLoadingMessageId = (Date.now() + 1).toString();
    const aiLoadingMessage: ChatMessage = {
      id: aiLoadingMessageId,
      role: 'ai',
      isLoading: true,
      timestamp: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, aiLoadingMessage]);

    try {
      const aiResponse = await getAIResponse(text, imageBase64);

      if ('error' in aiResponse) {
        setMessages((prevMessages) =>
          prevMessages.map(msg => 
            msg.id === aiLoadingMessageId 
            ? { ...msg, role: 'ai', advice: `Error: ${aiResponse.error}`, disclaimer: "Please try again.", isLoading: false, timestamp: new Date() } 
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
            ? { ...msg, role: 'ai', advice: aiResponse.advice, disclaimer: aiResponse.disclaimer, isLoading: false, timestamp: new Date() } 
            : msg
          )
        );
      }
    } catch (error) {
      console.error("Failed to get AI response:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      setMessages((prevMessages) =>
        prevMessages.map(msg => 
          msg.id === aiLoadingMessageId 
          ? { ...msg, role: 'ai', advice: `Error: ${errorMessage}`, disclaimer: "Please try again.", isLoading: false, timestamp: new Date() } 
          : msg
        )
      );
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to communicate with AI. " + errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
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

      <ChatInputBar onSubmit={handleSendMessage} isLoading={isLoading} />

      <ChatSidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
    </div>
  );
}
