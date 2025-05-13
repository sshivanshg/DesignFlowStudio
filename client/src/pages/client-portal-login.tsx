import React, { useState, useEffect } from "react";
import { useRoute, useRouter } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Mail, Unlock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function ClientPortalLogin() {
  const [_, params] = useRoute("/client-portal/login/:token?");
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);
  
  // Check for token in URL parameter
  useEffect(() => {
    const checkToken = async () => {
      if (params?.token) {
        setIsLoading(true);
        try {
          const response = await apiRequest(`/api/client-portal/validate-token/${params.token}`, {
            method: 'GET'
          });
          
          if (response && response.valid && response.clientId) {
            // Store token in localStorage
            localStorage.setItem('clientPortalToken', params.token);
            
            // Redirect to client portal
            router[0](`/client-portal/${response.clientId}`);
            
            toast({
              title: "Login Successful",
              description: "Welcome to your client portal",
            });
          } else {
            toast({
              title: "Invalid or Expired Token",
              description: "Please request a new login link",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error("Error validating token:", error);
          toast({
            title: "Login Failed",
            description: "Failed to validate your login token. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
          setTokenChecked(true);
        }
      } else {
        setTokenChecked(true);
      }
    };
    
    checkToken();
  }, [params?.token]);
  
  // Login request mutation
  const loginMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest('/api/client-portal/request-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Login Link Sent",
        description: "Check your email for a login link",
      });
      setEmail("");
    },
    onError: (error) => {
      console.error("Login error:", error);
      toast({
        title: "Request Failed",
        description: "Failed to send login link. Please try again or contact support.",
        variant: "destructive"
      });
    }
  });
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }
    
    loginMutation.mutate(email);
  };
  
  if (!tokenChecked || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md text-center">
          <div className="animate-pulse">
            <Unlock className="h-12 w-12 mx-auto text-primary mb-4" />
            <h1 className="text-2xl font-bold mb-2">Logging you in</h1>
            <p className="text-gray-500">Please wait while we verify your login...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Client Portal</h1>
          <p className="text-gray-500 mt-2">Access your projects, proposals, and more</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Log in to your account</CardTitle>
            <CardDescription>
              Enter your email to receive a secure login link
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      placeholder="you@company.com"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={loginMutation.isPending}
                    />
                  </div>
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Passwordless Login</AlertTitle>
                  <AlertDescription>
                    We'll send a secure login link to your email address.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Sending Link..." : "Send Login Link"}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        {loginMutation.isSuccess && (
          <div className="mt-6 text-center p-4 bg-green-50 border border-green-100 rounded-md">
            <h3 className="font-medium text-green-800">Check Your Email</h3>
            <p className="text-green-700 text-sm mt-1">
              We've sent a login link to {loginMutation.variables}.<br />
              The link is valid for 30 minutes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}