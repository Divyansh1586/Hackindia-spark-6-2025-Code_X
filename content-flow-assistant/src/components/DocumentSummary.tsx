import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen } from "lucide-react";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DocumentSummaryProps {
  sessionId: string | null;
}

export const DocumentSummary: React.FC<DocumentSummaryProps> = ({ sessionId }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateSummary = async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    try {
      const response = await apiService.summarizePdf(sessionId);
      setSummary(response.summary);
      toast.success("Summary generated successfully");
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error("Failed to generate summary");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Document Summary</CardTitle>
            <CardDescription>
              AI-generated summary of your document
            </CardDescription>
          </div>
          {!summary && sessionId && (
            <Button
              onClick={generateSummary}
              disabled={isLoading || !sessionId}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Generate Summary
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!sessionId ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No document loaded</p>
            <p className="text-sm mt-1">Upload or select a document to generate a summary</p>
          </div>
        ) : summary ? (
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-2 text-sm">
              <p className="whitespace-pre-wrap">{summary}</p>
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No summary available</p>
            <p className="text-sm mt-1">Click the button to generate a summary</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
