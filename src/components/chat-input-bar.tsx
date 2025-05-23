"use client"

import React, { useState, useRef, type ChangeEvent, type FormEvent } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SendHorizontal, ImageUp, Mic, Paperclip, X } from "lucide-react"
import Image from 'next/image'

interface ChatInputBarProps {
  onSubmit: (text: string, imageBase64?: string) => Promise<void>
  isLoading: boolean
}

export function ChatInputBar({ onSubmit, isLoading }: ChatInputBarProps) {
  const [inputValue, setInputValue] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      fileInputRef.current.value = ""; // Reset file input
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!inputValue.trim() && !selectedImage) return

    await onSubmit(inputValue.trim(), selectedImage ?? undefined)
    setInputValue("")
    removeSelectedImage();
  }

  return (
    <TooltipProvider delayDuration={200}>
      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 left-0 right-0 flex items-center gap-2 border-t bg-background p-3 md:p-4 shadow-md"
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
            <Button type="button" variant="outline" size="icon" onClick={triggerFileInput} disabled={isLoading}>
              <ImageUp className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Attach Image</p>
          </TooltipContent>
        </Tooltip>

        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Type your message or describe symptoms..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="pr-10 rounded-full"
            disabled={isLoading}
          />
          {selectedImage && (
            <div className="absolute bottom-12 left-0 mb-2 p-2 bg-muted rounded-lg shadow-sm flex items-center gap-2 max-w-xs">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate">{selectedFileName || 'Image selected'}</span>
                <Button type="button" variant="ghost" size="icon" onClick={removeSelectedImage} className="h-6 w-6">
                    <X className="h-4 w-4" />
                </Button>
            </div>
          )}
        </div>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="outline" size="icon" onClick={() => alert("Speech-to-text coming soon!")} disabled={isLoading}>
              <Mic className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Voice Input (Soon)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="submit" size="icon" disabled={isLoading || (!inputValue.trim() && !selectedImage)} className="rounded-full bg-primary hover:bg-primary/90">
              <SendHorizontal className="h-5 w-5 text-primary-foreground" />
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
