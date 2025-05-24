

"use client"

import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, UserCircle2, AlertTriangle, Info, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface ChatMessageProps {
  message: ChatMessage
}

export function ChatMessageCard({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const alignment = isUser ? "justify-end" : "justify-start"
  const bubbleStyles = isUser
    ? "bg-primary text-primary-foreground"
    : "bg-card text-card-foreground border border-border" 

  return (
    <div className={cn("flex items-end space-x-2 my-4", alignment)}>
      {!isUser && (
        <Avatar className="h-8 w-8 self-start shadow-sm">
          <AvatarFallback className="bg-accent text-accent-foreground">
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
      <Card className={cn("max-w-md lg:max-w-lg xl:max-w-xl rounded-xl shadow-md", bubbleStyles)}>
        <CardContent className="p-3 space-y-2">
          {message.isLoading ? (
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded-full bg-muted-foreground/30" />
              <Skeleton className="h-4 w-20 bg-muted-foreground/30" />
              <Skeleton className="h-4 w-16 bg-muted-foreground/30" />
            </div>
          ) : (
            <>
              {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
              {message.imageUrl && (
                <div className="mt-2">
                  <Image
                    src={message.imageUrl}
                    alt="User upload"
                    width={300}
                    height={200}
                    className="rounded-lg object-cover border"
                    data-ai-hint="medical condition"
                  />
                </div>
              )}
              {message.advice && <p className="whitespace-pre-wrap">{message.advice}</p>}
              
              {message.suggestions && message.suggestions.length > 0 && !isUser && (
                <div className="mt-2 pt-2 border-t border-dashed border-card-foreground/20">
                  <div className="flex items-center text-sm font-medium mb-1 text-card-foreground/90">
                    <Lightbulb className="h-4 w-4 mr-2 text-amber-500 dark:text-amber-400" />
                    Suggestions:
                  </div>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    {message.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-card-foreground/80">{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {message.knowledgeCutoffAndSources && !isUser && (
                 <div className="mt-2 pt-2 border-t border-dashed border-card-foreground/20 text-xs text-card-foreground/70">
                    <div className="flex items-center">
                        <Info className="h-3.5 w-3.5 mr-1.5 shrink-0"/>
                        <span>{message.knowledgeCutoffAndSources}</span>
                    </div>
                 </div>
              )}
            </>
          )}
        </CardContent>
        {(message.disclaimer || (!message.isLoading && !isUser)) && ( 
          <CardFooter className="p-3 pt-1 text-xs">
            {isUser ? (
              <time dateTime={message.timestamp.toISOString()} className="text-muted-foreground">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </time>
            ) : message.isLoading ? null : (
               <div className="flex items-start space-x-1 text-muted-foreground/80">
                 <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500 dark:text-amber-400" />
                 <span>{message.disclaimer || "Always consult a doctor."}</span>
               </div>
            )}
          </CardFooter>
        )}
      </Card>
      {isUser && (
        <Avatar className="h-8 w-8 self-start shadow-sm">
           <AvatarFallback className="bg-muted">
            <UserCircle2 className="h-5 w-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}

