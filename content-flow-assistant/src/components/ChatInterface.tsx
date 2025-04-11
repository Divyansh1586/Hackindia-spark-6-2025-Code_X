import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send } from "lucide-react";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
  sources?: Array<{
    index: number;
    preview: string;
  }>;
}

interface ChatInterfaceProps {
  sessionId: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ sessionId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionId && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          text: "Hello! I'm your Document AI Assistant. You can ask me questions about the document you've uploaded.",
          sender: "assistant",
          timestamp: new Date(),
        },
      ]);
    }
  }, [sessionId, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || !sessionId) return;
    
    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      const response = await apiService.query({
        query: input,
        sessionId,
      });
      
      const newAssistantMessage: Message = {
        id: `response-${Date.now()}`,
        text: response.answer,
        sender: "assistant",
        timestamp: new Date(),
        sources: response.sources,
      };
      
      setMessages((prev) => [...prev, newAssistantMessage]);
    } catch (error) {
      console.error("Error querying document:", error);
      toast.error("Failed to get a response");
      
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          text: "Sorry, I couldn't process your question. Please try again.",
          sender: "assistant",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[600px] shadow-md">
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-lg font-semibold">Chat with your Document</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[490px] p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.sender === "user"
                      ? "bg-docai-primary text-white"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200/30">
                      <p className="text-xs font-semibold mb-1">Sources:</p>
                      {message.sources.map((source, i) => (
                        <div key={i} className="text-xs opacity-90 mb-1">
                          {source.preview.substring(0, 100)}...
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-right mt-1">
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t p-3">
        <form onSubmit={handleSendMessage} className="flex w-full gap-2">
          <Input
            placeholder="Ask a question about your document..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || !sessionId}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim() || !sessionId}
            className="bg-docai-primary hover:bg-docai-primary/90"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};
