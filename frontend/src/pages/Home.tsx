import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  Code, 
  FileText, 
  Home as HomeIcon, 
  Layout, 
  MessageSquare, 
  Shield, 
  User, 
  Upload,
  Calendar,
  LayoutDashboard
} from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useAuth } from "@/contexts/AuthContext";

export const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 -z-10" />
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-1 space-y-4 text-center md:text-left">
              <Badge className="mb-2" variant="outline">Doc AI Platform</Badge>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tighter">
                Document AI <span className="text-primary">Assistant</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-[600px]">
                A powerful AI-powered platform that helps you manage, analyze, and interact with your documents through natural language conversations.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-4 md:justify-start justify-center">
                <Button size="lg" asChild>
                  {isAuthenticated ? (
                    <Link to="/dashboard">Go to Dashboard</Link>
                  ) : (
                    <Link to="/login-signup">Get Started</Link>
                  )}
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="https://github.com/Divyansh1586/content-flow-assistant" target="_blank">
                    <Code className="mr-2" />
                    View Source
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex-1">
              <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden">
                <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center">
                  <FileText className="h-24 w-24 text-white opacity-75" />
                </div>
              </AspectRatio>
            </div>
          </div>
        </div>
      </section>

      {/* About Project Section */}
      <section className="py-16 bg-muted/40">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">About This Project</h2>
            <p className="text-muted-foreground">
              Document AI is a comprehensive platform that leverages cutting-edge AI technology to transform how you interact with documents. Upload, analyze, and chat with your documents in a natural, intuitive way.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Secure Authentication</CardTitle>
                <CardDescription>
                  Robust user authentication system to keep your documents safe
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Upload className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Document Upload</CardTitle>
                <CardDescription>
                  Easy document uploading and management
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <MessageSquare className="h-10 w-10 text-primary mb-2" />
                <CardTitle>AI Chat Interface</CardTitle>
                <CardDescription>
                  Interact with your documents using natural language
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Components Section */}
      <section className="py-16">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Components Used</h2>
          
          <Carousel className="max-w-md mx-auto">
            <CarouselContent>
              <CarouselItem>
                <Card>
                  <CardHeader>
                    <CardTitle>UI Components</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <Badge variant="outline">Button</Badge>
                        <Badge variant="outline">Card</Badge>
                        <Badge variant="outline">Badge</Badge>
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline">Avatar</Badge>
                        <Badge variant="outline">Alert</Badge>
                        <Badge variant="outline">Carousel</Badge>
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline">Calendar</Badge>
                        <Badge variant="outline">Checkbox</Badge>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </CarouselItem>
              <CarouselItem>
                <Card>
                  <CardHeader>
                    <CardTitle>Layout Components</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <Badge variant="outline">AspectRatio</Badge>
                        <Badge variant="outline">Collapsible</Badge>
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline">Accordion</Badge>
                        <Badge variant="outline">Breadcrumb</Badge>
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline">Command</Badge>
                        <Badge variant="outline">AlertDialog</Badge>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </CarouselItem>
              <CarouselItem>
                <Card>
                  <CardHeader>
                    <CardTitle>Feature Components</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <Badge variant="outline">Authentication</Badge>
                        <Badge variant="outline">Dashboard</Badge>
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline">Document Upload</Badge>
                        <Badge variant="outline">Chat Interface</Badge>
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline">Session List</Badge>
                        <Badge variant="outline">Document Summary</Badge>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="left-0" />
            <CarouselNext className="right-0" />
          </Carousel>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6 mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="mb-6 max-w-md mx-auto">Join now and experience the power of Document AI for all your document management needs.</p>
          <Button size="lg" variant="secondary" asChild>
            {isAuthenticated ? (
              <Link to="/dashboard">Go to Dashboard</Link>
            ) : (
              <Link to="/login-signup">Sign Up Now</Link>
            )}
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;