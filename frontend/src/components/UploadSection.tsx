import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const [fileInputKey, setFileInputKey] = useState(0); // 👈 for resetting file input

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log("Selected file:", file); // ✅ Debug

      if (file.type !== "application/pdf") {
        toast.error("Please upload a valid PDF file");
        return;
      }

      setPdfFile(file);
    }
  };

  const handleUploadPdf = async () => {
    if (!pdfFile) {
      toast.error("Please select a PDF file to process");
      return;
    }
  
    setIsUploading(true);
  
    try {
      const formData = new FormData();
      formData.append("file", pdfFile);

   // debug line before fetch call

      const token = localStorage.getItem("token");
  
      const response = await fetch("http://localhost:8000/process-pdf", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          // DO NOT manually set "Content-Type" for FormData
        },
        body: formData,
      });
      console.log("Token used:", token); // debug line before fetch call
      console.log("Response status:", response.status); // debug line before fetch call
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Upload failed");
      }
  
      const result = await response.json();
      toast.success("PDF processed successfully");
      onSessionCreated(result.session_id);
      setPdfFile(null);
    } catch (error) {
      console.error("Error uploading PDF:", error);
      toast.error((error as Error).message || "Failed to process PDF");
    } finally {
      setIsUploading(false);
    }
  };
  
  

  const handleProcessUrl = async () => {
    const urlList = url
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u !== "");
  
    if (urlList.length === 0 || urlList.length > 5) {
      toast.error("Please enter between 1 to 5 URLs");
      return;
    }
  
    for (const u of urlList) {
      try {
        new URL(u);
      } catch (e) {
        toast.error(`Invalid URL: ${u}`);
        return;
      }
    }
  
    setIsUploading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/process-urls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ urls: urlList }),
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "URL processing failed");
      }
  
      const result = await response.json();
      toast.success("URL processing started");
      onSessionCreated(result.session_id);
      setUrl("");
    } catch (error) {
      console.error("Error processing URLs:", error);
      toast.error((error as Error).message || "Failed to process URLs");
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
                    key={fileInputKey} // 👈 re-render trick
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                </div>
              </div>

              {pdfFile ? (
                <div className="flex items-center p-2 bg-muted rounded">
                  <FileText className="h-5 w-5 mr-2 text-docai-primary" />
                  <span className="text-sm truncate flex-1">{pdfFile.name}</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No file selected</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="url" className="mt-4">
            <div className="space-y-2">
            <Label htmlFor="url-input">Enter URLs (1–5, one per line)</Label>
<textarea
  id="url-input"
  rows={5}
  placeholder="https://example.com\nhttps://another.com"
  value={url}
  onChange={(e) => setUrl(e.target.value)}
  className="w-full rounded-md border p-2 text-sm"
></textarea>

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
      Processing...
    </>
  ) : (
    <>
      <Upload className="mr-2 h-4 w-4" />
      Process
    </>
  )}
</Button>

      </CardFooter>
    </Card>
  );
};
