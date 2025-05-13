import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhoneIcon, KeyIcon, UserIcon, MailIcon } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  company: z.string().optional(),
});

const phoneLoginSchema = z.object({
  phoneNumber: z.string()
    .min(10, "Please enter a valid phone number")
    .refine((val) => /^\+?[0-9\s-()]+$/.test(val), {
      message: "Please enter a valid phone number",
    }),
});

const otpVerificationSchema = z.object({
  otp: z.string()
    .min(6, "OTP must be at least 6 digits")
    .max(6, "OTP must be at most 6 digits")
    .refine((val) => /^[0-9]+$/.test(val), {
      message: "OTP must contain only digits",
    }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type PhoneLoginFormValues = z.infer<typeof phoneLoginSchema>;
type OtpVerificationFormValues = z.infer<typeof otpVerificationSchema>;

export default function Login() {
  const [activeTab, setActiveTab] = useState<"login" | "register" | "phone">("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  
  // Reset OTP input and clear recaptcha when changing tabs
  useEffect(() => {
    setShowOtpInput(false);
    // Clear any existing recaptcha when switching to phone tab
    if (activeTab === "phone" && (window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      } catch (error) {
        console.error("Error clearing recaptcha:", error);
      }
    }
  }, [activeTab]);
  
  const { login, register: registerFirebase, loginWithPhone, loginWithGoogle, verifyOtp } = useAuth();
  const { signInWithEmail, signInWithGoogle: supabaseSignInWithGoogle, signUp, signOut } = useSupabaseAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      fullName: "",
      company: "",
    },
  });
  
  // Phone login form
  const phoneLoginForm = useForm<PhoneLoginFormValues>({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: {
      phoneNumber: "",
    },
  });
  
  // OTP verification form
  const otpVerificationForm = useForm<OtpVerificationFormValues>({
    resolver: zodResolver(otpVerificationSchema),
    defaultValues: {
      otp: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      await signInWithEmail(data.email, data.password);
      toast({
        title: "Login successful",
        description: "You have been successfully logged in",
      });
      setLocation("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Failed to login with email and password",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      await signUp(data.email, data.password, {
        username: data.username,
        fullName: data.fullName,
        company: data.company || undefined,
        role: 'designer' // Default role
      });
      
      toast({
        title: "Registration successful",
        description: "Your account has been created successfully",
      });
      
      setLocation("/dashboard");
    } catch (error) {
      console.error("Registration failed:", error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Failed to create an account",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onPhoneLoginSubmit = async (data: PhoneLoginFormValues) => {
    setIsSubmitting(true);
    try {
      if (!recaptchaContainerRef.current) {
        throw new Error("reCAPTCHA container not found");
      }
      
      // Format phone number to ensure it has country code
      let phoneNumber = data.phoneNumber;
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = `+1${phoneNumber}`; // Default to US country code if not provided
      }
      
      await loginWithPhone(phoneNumber, "recaptcha-container");
      setShowOtpInput(true);
    } catch (error) {
      console.error("Phone authentication failed:", error);
      // Display error message
      toast({
        title: "Authentication failed",
        description: error instanceof Error ? error.message : "Failed to authenticate with phone number",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onOtpVerificationSubmit = async (data: OtpVerificationFormValues) => {
    setIsSubmitting(true);
    try {
      await verifyOtp(data.otp);
      // No need to redirect as it's handled in the verifyOtp function
    } catch (error) {
      console.error("OTP verification failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {activeTab === "login" ? "Welcome back" : "Create an account"}
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === "login" 
                ? "Enter your credentials to sign in" 
                : "Enter your details to create your account"}
            </CardDescription>
          </CardHeader>
          
          <Tabs 
            value={activeTab} 
            onValueChange={(v) => setActiveTab(v as "login" | "register" | "phone")}
            className="w-full"
          >
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="login" className="pt-2">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                  <CardContent className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter your email" 
                              autoComplete="email"
                              type="email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password" 
                              placeholder="Enter your password" 
                              autoComplete="current-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Signing in...</span>
                        </div>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">Or continue with</span>
                      </div>
                    </div>
                    
                    <GoogleSignInButton />
                  </CardFooter>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="phone" className="pt-2">
              {!showOtpInput ? (
                <Form {...phoneLoginForm}>
                  <form onSubmit={phoneLoginForm.handleSubmit(onPhoneLoginSubmit)}>
                    <CardContent className="space-y-4">
                      <FormField
                        control={phoneLoginForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <PhoneIcon className="mr-2 h-4 w-4 text-gray-500" />
                                <Input 
                                  {...field} 
                                  placeholder="+1 (555) 123-4567" 
                                  autoComplete="tel"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div id="recaptcha-container" ref={recaptchaContainerRef} className="recaptcha-container"></div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Sending code...</span>
                          </div>
                        ) : (
                          "Send Verification Code"
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              ) : (
                <Form {...otpVerificationForm}>
                  <form onSubmit={otpVerificationForm.handleSubmit(onOtpVerificationSubmit)}>
                    <CardContent className="space-y-4">
                      <FormField
                        control={otpVerificationForm.control}
                        name="otp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Verification Code</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <KeyIcon className="mr-2 h-4 w-4 text-gray-500" />
                                <Input 
                                  {...field} 
                                  placeholder="Enter 6-digit code" 
                                  autoComplete="one-time-code"
                                  maxLength={6}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-2">
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Verifying...</span>
                          </div>
                        ) : (
                          "Verify & Sign In"
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost"
                        className="w-full"
                        onClick={() => setShowOtpInput(false)}
                      >
                        Back to phone number
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              )}
            </TabsContent>
            
            <TabsContent value="register" className="pt-2">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                  <CardContent className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter your full name" 
                              autoComplete="name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter your email" 
                              type="email" 
                              autoComplete="email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Choose a username" 
                              autoComplete="username"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password" 
                              placeholder="Create a password" 
                              autoComplete="new-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter your company name" 
                              autoComplete="organization"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Creating account...</span>
                        </div>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">Or continue with</span>
                      </div>
                    </div>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => loginWithGoogle()}
                      disabled={isSubmitting}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Sign up with Google
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </Card>
        
        <p className="text-center text-gray-500 text-sm mt-6">
          InteriDesign Studio - Interior Design Management Platform
        </p>
      </div>
    </div>
  );
}
