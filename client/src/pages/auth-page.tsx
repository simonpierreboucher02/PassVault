import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Shield, Key, User, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { RecoveryKeyModal } from "@/components/recovery-key-modal";
import { apiRequest } from "@/lib/queryClient";
import { insertUserSchema } from "@shared/schema";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const recoverySchema = z.object({
  username: z.string().min(1, "Username is required"),
  recoveryKey: z.string().min(1, "Recovery key is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;
type RecoveryFormData = z.infer<typeof recoverySchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showRecoveryKey, setShowRecoveryKey] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState("");
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();

  const recoveryMutation = useMutation({
    mutationFn: async (data: RecoveryFormData) => {
      const res = await apiRequest("POST", "/api/reset-password", {
        username: data.username,
        recoveryKey: data.recoveryKey,
        newPassword: data.newPassword,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password reset successful",
        description: "Your password has been reset. You can now login with your new password.",
      });
      recoveryForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const recoveryForm = useForm<RecoveryFormData>({
    resolver: zodResolver(recoverySchema),
    defaultValues: {
      username: "",
      recoveryKey: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user && !showRecoveryKey && !registerMutation.isSuccess) {
      // Only redirect if user exists, no recovery key modal to show, and not from a recent registration
      setLocation("/");
    }
  }, [user, setLocation, showRecoveryKey, registerMutation.isSuccess]);

  const onLogin = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterFormData) => {
    // Generate recovery key
    const generatedRecoveryKey = generateRecoveryKey();
    setRecoveryKey(generatedRecoveryKey);
    
    registerMutation.mutate({
      username: data.username,
      password: data.password,
      recoveryKey: generatedRecoveryKey,
    });
  };

  const onRecovery = (data: RecoveryFormData) => {
    recoveryMutation.mutate(data);
  };

  // Show recovery key modal when registration succeeds
  useEffect(() => {
    if (registerMutation.isSuccess && !registerMutation.isPending && recoveryKey) {
      setShowRecoveryKey(true);
    }
  }, [registerMutation.isSuccess, registerMutation.isPending, recoveryKey]);

  const generateRecoveryKey = (): string => {
    const words = [
      "apple", "brave", "chair", "dance", "eagle", "flame", "grace", "heart",
      "ivory", "judge", "kneel", "light", "magic", "noble", "ocean", "peace",
      "quiet", "river", "storm", "trust", "unity", "voice", "world", "youth"
    ];
    
    const key = [];
    for (let i = 0; i < 12; i++) {
      key.push(words[Math.floor(Math.random() * words.length)]);
    }
    return key.join("-");
  };

  const handleRecoveryKeySaved = () => {
    setShowRecoveryKey(false);
    setLocation("/");
  };

  if (user && !showRecoveryKey) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="text-primary-foreground w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">PassVault</h1>
            <p className="text-muted-foreground mt-2">Secure your digital life with minimal authentication</p>
          </div>

          <Tabs defaultValue="login" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
              <TabsTrigger value="recovery" data-testid="tab-recovery">Recovery</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                  {...field}
                                  placeholder="Enter your username"
                                  className="pl-10"
                                  data-testid="input-login-username"
                                />
                              </div>
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
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                  {...field}
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Enter your password"
                                  className="pl-10 pr-10"
                                  data-testid="input-login-password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                  data-testid="button-toggle-password-login"
                                >
                                  {showPassword ? (
                                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <Eye className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loginMutation.isPending}
                        data-testid="button-login"
                      >
                        {loginMutation.isPending ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create account</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                  {...field}
                                  placeholder="Choose a username"
                                  className="pl-10"
                                  data-testid="input-register-username"
                                />
                              </div>
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
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                  {...field}
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Create a password"
                                  className="pl-10 pr-10"
                                  data-testid="input-register-password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                  data-testid="button-toggle-password-register"
                                >
                                  {showPassword ? (
                                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <Eye className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                  {...field}
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Confirm your password"
                                  className="pl-10"
                                  data-testid="input-confirm-password"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={registerMutation.isPending}
                        data-testid="button-register"
                      >
                        {registerMutation.isPending ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recovery">
              <Card>
                <CardHeader>
                  <CardTitle>Reset Password</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Use your recovery key to reset your password
                  </p>
                </CardHeader>
                <CardContent>
                  <Form {...recoveryForm}>
                    <form onSubmit={recoveryForm.handleSubmit(onRecovery)} className="space-y-4">
                      <FormField
                        control={recoveryForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                  {...field}
                                  placeholder="Enter your username"
                                  className="pl-10"
                                  data-testid="input-recovery-username"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={recoveryForm.control}
                        name="recoveryKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Recovery Key</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Enter your 12-word recovery key (separated by dashes)"
                                className="min-h-20"
                                data-testid="input-recovery-key"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={recoveryForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                  {...field}
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Enter new password"
                                  className="pl-10 pr-10"
                                  data-testid="input-new-password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                                  onClick={() => setShowPassword(!showPassword)}
                                  data-testid="button-toggle-password"
                                >
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={recoveryForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                  {...field}
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Confirm new password"
                                  className="pl-10"
                                  data-testid="input-confirm-new-password"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={recoveryMutation.isPending}
                        data-testid="button-reset-password"
                      >
                        {recoveryMutation.isPending ? "Resetting password..." : "Reset Password"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:flex lg:flex-1 bg-primary/5 items-center justify-center p-8">
        <div className="max-w-md text-center">
          <Key className="mx-auto w-16 h-16 text-primary mb-6" />
          <h2 className="text-2xl font-bold text-foreground mb-4">Privacy-First Password Management</h2>
          <div className="space-y-4 text-muted-foreground">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Minimal Authentication</h3>
                <p className="text-sm">Just username + password + recovery key. No email or phone required.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Lock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-foreground">AES-256 Encryption</h3>
                <p className="text-sm">Your passwords are encrypted with industry-grade security.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Key className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Recovery Key System</h3>
                <p className="text-sm">Reset your password without exposing your stored data.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RecoveryKeyModal
        isOpen={showRecoveryKey}
        recoveryKey={recoveryKey}
        onSaved={handleRecoveryKeySaved}
      />
    </div>
  );
}
