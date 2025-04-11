import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Globe, Clock } from "lucide-react";

interface Session {
  session_id: string;
  created_at: string;
  title: string;
  type: "pdf" | "url";
  status: "processing" | "complete" | "error";
}

interface SessionListProps {
  onSessionSelect: (sessionId: string) => void;
  currentSessionId: string | null;
  refreshTrigger: number;
}

export const SessionList: React.FC<SessionListProps> = ({
  onSessionSelect,
  currentSessionId,
  refreshTrigger,
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [refreshTrigger]);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getMySessions();
      // Make sure response and response.sessions exist before setting state
      if (response && response.sessions) {
        setSessions(response.sessions);
      } else {
        // If response.sessions is undefined, set sessions to an empty array
        setSessions([]);
        console.warn("No sessions data received from API");
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load your sessions");
      // Reset to empty array on error
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    try {
      await apiService.loadSession(sessionId);
      onSessionSelect(sessionId);
      toast.success("Session loaded successfully");
    } catch (error) {
      console.error("Error loading session:", error);
      toast.error("Failed to load session");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getSessionIcon = (type: "pdf" | "url") => {
    return type === "pdf" ? (
      <FileText className="h-4 w-4" />
    ) : (
      <Globe className="h-4 w-4" />
    );
  };

  const getStatusColor = (status: "processing" | "complete" | "error") => {
    switch (status) {
      case "processing":
        return "text-orange-500";
      case "complete":
        return "text-green-500";
      case "error":
        return "text-red-500";
      default:
        return "";
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Your Sessions</CardTitle>
        <CardDescription>
          Previously processed documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>You don't have any sessions yet</p>
            <p className="text-sm mt-1">Upload a document to get started</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {sessions.map((session) => (
                <Button
                  key={session.session_id}
                  variant={currentSessionId === session.session_id ? "default" : "outline"}
                  className={`w-full justify-start text-left h-auto py-3 ${
                    currentSessionId === session.session_id
                      ? "bg-docai-primary hover:bg-docai-primary/90"
                      : ""
                  }`}
                  onClick={() => handleSelectSession(session.session_id)}
                >
                  <div className="flex items-start gap-2 w-full">
                    <div className="mt-0.5">{getSessionIcon(session.type)}</div>
                    <div className="flex-1 overflow-hidden">
                      <div className="font-medium truncate">{session.title || session.session_id}</div>
                      <div className="flex items-center gap-1 text-xs opacity-70">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(session.created_at)}</span>
                      </div>
                      <div className={`text-xs mt-1 ${getStatusColor(session.status)}`}>
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};