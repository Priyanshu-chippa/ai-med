"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { UserCircle, MessageSquareText, History, X } from "lucide-react"

interface ChatSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function ChatSidebar({ isOpen, onClose }: ChatSidebarProps) {
  // Placeholder data
  const recentChats = [
    { id: "1", title: "Symptom Check: Headache" },
    { id: "2", title: "Question about medication" },
    { id: "3", title: "Follow-up on skin rash" },
  ]
  const olderChats = [
    { id: "4", title: "Initial consultation" },
    { id: "5", title: "Blood test results discussion" },
  ]

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 flex flex-col bg-card">
        <SheetHeader className="p-4 border-b">
          <div className="flex justify-between items-center">
            <SheetTitle className="text-lg font-semibold">Profile & Chats</SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-5 w-5" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>
        
        <ScrollArea className="flex-1">
          {/* Profile Section */}
          <div className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="person portrait" />
                <AvatarFallback>
                  <UserCircle className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-card-foreground">Guest User</p>
                <p className="text-sm text-muted-foreground">example@medimate.ai</p>
              </div>
            </div>
            <Button variant="outline" className="w-full">View Profile</Button>
          </div>

          <Separator className="my-2" />

          {/* Recent Chats Section */}
          <div className="p-4">
            <div className="flex items-center mb-3 text-muted-foreground">
              <MessageSquareText className="h-5 w-5 mr-2" />
              <h3 className="text-sm font-medium">Recent Chats</h3>
            </div>
            <ul className="space-y-2">
              {recentChats.map((chat) => (
                <li key={chat.id}>
                  <Button variant="ghost" className="w-full justify-start text-card-foreground hover:bg-accent hover:text-accent-foreground">
                    {chat.title}
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          <Separator className="my-2" />

          {/* Older Chats Section */}
          <div className="p-4">
            <div className="flex items-center mb-3 text-muted-foreground">
              <History className="h-5 w-5 mr-2" />
              <h3 className="text-sm font-medium ">Older Chats</h3>
            </div>
            <ul className="space-y-2">
              {olderChats.map((chat) => (
                <li key={chat.id}>
                  <Button variant="ghost" className="w-full justify-start text-card-foreground hover:bg-accent hover:text-accent-foreground">
                    {chat.title}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
            <Button variant="destructive" className="w-full">Logout</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
