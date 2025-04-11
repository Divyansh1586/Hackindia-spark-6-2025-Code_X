import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import './App.css';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Login attempt with:', { email, password });
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-black mx-auto">
          <Lock className="h-8 w-8 text-white" />
        </div>
        
        <Card className="w-full shadow-xl border-0">
          <CardHeader className="space-y-3 pb-4">
            <CardTitle className="text-2xl font-bold text-black text-center">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 text-left">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10 bg-white border-gray-200 focus:border-black focus:ring-black text-black"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 text-left">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 bg-white border-gray-200 focus:border-black focus:ring-black text-black"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end p-4">
                  <Button
                    variant="link"
                    className="text-white text-sm hover:text-white p-2"
                  >
                    Forgot password?
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                variant="default"
                className="w-full bg-black hover:bg-gray-800 text-white [&>span]:text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="text-white">Signing in...</span>
                ) : (
                  <span className="flex items-center justify-center text-white">
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>

          <Separator className="my-4" />
          
          <CardFooter>
            <p className="text-sm text-gray-600 text-center w-full">
              Don't have an account?{" "}
              <Button
                variant="link"
                className="text-white hover:text-white p-2"
              >
                Create One
              </Button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default App;