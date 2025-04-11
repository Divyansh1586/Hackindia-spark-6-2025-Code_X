import { useState } from "react";
import { Header } from "@/components/Header";
import { UploadSection } from "@/components/UploadSection";
import { ChatInterface } from "@/components/ChatInterface";
import { SessionList } from "@/components/SessionList";
import { DocumentSummary } from "@/components/DocumentSummary";

const Dashboard = () => {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSessionCreated = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setRefreshTrigger((prev) => prev + 1); // Refresh session list
  };

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 container mx-auto py-6 px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Upload + Sessions */}
          <div className="space-y-6">
            <UploadSection onSessionCreated={handleSessionCreated} />
            <SessionList
              currentSessionId={currentSessionId}
              onSessionSelect={handleSessionSelect}
              refreshTrigger={refreshTrigger}
            />
          </div>

          {/* Right Columns: Chat + Summary */}
          <div className="lg:col-span-2 space-y-6">
            {currentSessionId ? (
              <>
                <ChatInterface sessionId={currentSessionId} />
                <DocumentSummary sessionId={currentSessionId} />
              </>
            ) : (
              <div className="text-muted-foreground text-center mt-10">
                <p>Select or upload a document to start interacting with it.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
