import React, { useState, useEffect } from "react";
import { useLocation, useRoute, useRouter } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ClientPortalLogin() {
  const { toast } = useToast();
  const router = useRouter();
  const [_, params] = useRoute('/client-portal/login/:token?');
  const [token, setToken] = useState(params?.token || '');
  const [isLoading, setIsLoading] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  useEffect(() => {
    // If token is in the URL, attempt to log in automatically
    if (params?.token) {
      handleLogin();
    }
  }, [params]);

  async function handleLogin() {
    if (!token.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid login token",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setInvalidToken(false);

    try {
      const response = await apiRequest('/api/client-portal/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.success) {
        // Store client info and token in local storage
        localStorage.setItem('clientPortalToken', response.token);
        localStorage.setItem('clientInfo', JSON.stringify(response.client));
        
        toast({
          title: "Success",
          description: "You've successfully logged in to the client portal",
        });
        
        // Redirect to client portal dashboard
        router[0](`/client-portal/${response.client.id}`);
      } else {
        throw new Error("Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setInvalidToken(true);
      toast({
        title: "Login Failed",
        description: "The token you entered is invalid or expired",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Client Portal</CardTitle>
          <CardDescription className="text-center">
            Enter your login token to access your interior design projects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Login Token</Label>
            <Input
              id="token"
              placeholder="Enter your login token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className={invalidToken ? "border-red-500" : ""}
            />
            {invalidToken && (
              <p className="text-sm text-red-500">
                Invalid or expired token. Please request a new login link.
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            className="w-full" 
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login to Client Portal"}
          </Button>
          <p className="text-sm text-center text-gray-500">
            Don't have a login token? Contact your designer to receive a login link.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}