
"use client"

import React, { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from 'react'
import { Textarea } from "@/components/ui/textarea" // Changed from Input
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SendHorizontal, ImageUp, Mic, Paperclip, X, MicOff } from "lucide-react"
import { useToast } from '@/hooks/use-toast'

interface ChatInputBarProps {
  onSubmit: (text: string, imageBase64?: string) => Promise<void>
  isLoading: boolean
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition | undefined;
    webkitSpeechRecognition: typeof SpeechRecognition | undefined;
  }
}

export function ChatInputBar({ onSubmit, isLoading }: ChatInputBarProps) {
  const [inputValue, setInputValue] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null) // Ref for textarea
  const { toast } = useToast();

  const [isListening, setIsListening] = useState(false);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          fullTranscript += event.results[i][0].transcript;
        }
        setInputValue(fullTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        let errorMessage = 'Speech recognition error: ' + event.error;
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            errorMessage = "Microphone access denied. Please enable it in your browser settings.";
        } else if (event.error === 'no-speech') {
            errorMessage = "No speech detected. Please try again.";
        } else if (event.error === 'audio-capture') {
            errorMessage = "Microphone not available or not working.";
        }
        toast({ variant: "destructive", title: "Speech Error", description: errorMessage });
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
      
      speechRecognitionRef.current = recognition;
    }

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    };
  }, [toast]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height to shrink if text is deleted
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
      // Max height check
      if (scrollHeight > 200) { // Max height of 200px
          textareaRef.current.style.height = '200px';
          textareaRef.current.style.overflowY = 'auto';
      } else {
          textareaRef.current.style.overflowY = 'hidden';
      }
    }
  }, [inputValue]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFileName(file.name);
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setSelectedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!inputValue.trim() && !selectedImage) return

    if (isListening && speechRecognitionRef.current) {
        speechRecognitionRef.current.stop(); 
    }
    await onSubmit(inputValue.trim(), selectedImage ?? undefined)
    setInputValue("")
    removeSelectedImage();
    if (textareaRef.current) { // Reset textarea height after submit
        textareaRef.current.style.height = 'auto';
    }
  }

  const toggleListening = async () => {
    if (!speechRecognitionRef.current) {
      toast({ variant: "destructive", title: "Unsupported", description: "Speech recognition is not supported in your browser." });
      return;
    }

    if (isListening) {
      speechRecognitionRef.current.stop();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setInputValue(""); 
        speechRecognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Microphone permission error:", err);
        toast({ variant: "destructive", title: "Mic Permission Error", description: "Could not access microphone." });
        setIsListening(false);
      }
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 left-0 right-0 flex items-end gap-2 border-t bg-background p-3 md:p-4 shadow-md" // items-end for textarea
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="hidden"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="outline" size="icon" onClick={triggerFileInput} disabled={isLoading || isListening} className="rounded-full self-end mb-1"> {/* Align button with textarea bottom */}
              <ImageUp className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Attach Image</p>
          </TooltipContent>
        </Tooltip>

        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            placeholder={isListening ? "Listening..." : "Type your message or describe symptoms..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="pr-10 rounded-xl py-2 text-base min-h-[40px] max-h-[200px] resize-none overflow-y-hidden" // Added styles for textarea
            rows={1} // Start with 1 row
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
              }
            }}
          />
          {selectedImage && (
            <div className="absolute bottom-[calc(100%+0.5rem)] left-0 mb-2 p-2 bg-muted/80 backdrop-blur-sm rounded-lg shadow-sm flex items-center gap-2 max-w-[calc(100%-2rem)] border border-border">
                <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate flex-1">{selectedFileName || 'Image selected'}</span>
                <Button type="button" variant="ghost" size="icon" onClick={removeSelectedImage} className="h-6 w-6 rounded-full hover:bg-destructive/20">
                    <X className="h-4 w-4 text-destructive" />
                </Button>
            </div>
          )}
        </div>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
                type="button" 
                variant={isListening ? "destructive" : "outline"} 
                size="icon" 
                onClick={toggleListening} 
                disabled={isLoading || !speechRecognitionRef.current} 
                className="rounded-full self-end mb-1" // Align button
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isListening ? "Stop Listening" : (speechRecognitionRef.current ? "Start Listening" : "Speech not supported")}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="submit" size="icon" disabled={isLoading || (!inputValue.trim() && !selectedImage)} className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground aspect-square self-end mb-1"> {/* Align button */}
              <SendHorizontal className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Send Message</p>
          </TooltipContent>
        </Tooltip>
      </form>
    </TooltipProvider>
  )
}
