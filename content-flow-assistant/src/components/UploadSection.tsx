import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Link, Loader2, Upload } from "lucide-react";
import { apiService } from "@/services/api";
import { toast } from "sonner";

interface UploadSectionProps {
  onSessionCreated: (sessionId: string) => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({ onSessionCreated }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [activeTab, setActiveTab] = useState("pdf");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      setPdfFile(file);
    }
  };

  const handleUploadPdf = async () => {
    if (!pdfFile) {
      toast.error("Please select a PDF file to upload");
      return;
    }

    setIsUploading(true);
    try {
      const response = await apiService.processPdf({ file: pdfFile });
      toast.success("PDF uploaded successfully");
      onSessionCreated(response.session_id);
      setPdfFile(null);
    } catch (error) {
      console.error("Error uploading PDF:", error);
      toast.error("Failed to upload PDF");
    } finally {
      setIsUploading(false);
    }
  };

  const handleProcessUrl = async () => {
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }

    // Simple URL validation
    try {
      new URL(url);
    } catch (e) {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsUploading(true);
    try {
      const response = await apiService.processUrl({ url });
      toast.success("URL processed successfully");
      onSessionCreated(response.session_id);
      setUrl("");
    } catch (error) {
      console.error("Error processing URL:", error);
      toast.error("Failed to process URL");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle>Upload Content</CardTitle>
        <CardDescription>
          Upload a PDF or enter a URL to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pdf">
              <FileText className="h-4 w-4 mr-2" />
              PDF Upload
            </TabsTrigger>
            <TabsTrigger value="url">
              <Link className="h-4 w-4 mr-2" />
              URL Processing
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pdf" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pdf-upload">Upload PDF</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                </div>
              </div>
              
              {pdfFile && (
                <div className="flex items-center p-2 bg-muted rounded">
                  <FileText className="h-5 w-5 mr-2 text-docai-primary" />
                  <span className="text-sm truncate flex-1">{pdfFile.name}</span>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="url" className="mt-4">
            <div className="space-y-2">
              <Label htmlFor="url-input">Enter URL</Label>
              <Input
                id="url-input"
                type="url"
                placeholder="https://example.com/document"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button
          onClick={activeTab === "pdf" ? handleUploadPdf : handleProcessUrl}
          disabled={isUploading || (activeTab === "pdf" ? !pdfFile : !url)}
          className="ml-auto bg-docai-primary hover:bg-docai-primary/90"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {activeTab === "pdf" ? "Uploading..." : "Processing..."}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {activeTab === "pdf" ? "Upload PDF" : "Process URL"}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
