import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Shield, Zap } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password must be less than 72 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters").optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading: authLoading } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [passwordResetSentTo, setPasswordResetSentTo] = useState<string | null>(null);

  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const redirectedRef = useRef(false);

  useEffect(() => {
    // Parse both search params and hash for recovery token
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace("#", "?"));

    const isRecoveryFromSearch = urlParams.get("type") === "recovery";
    const isRecoveryFromHash = hashParams.get("type") === "recovery";

    const isRecovery = isRecoveryFromSearch || isRecoveryFromHash;

    if (isRecovery) {
      setRecoveryMode(true);
    }
  }, []);

  useEffect(() => {
    // reset redirect guard if we're not authenticated
    if (!session?.user) {
      redirectedRef.current = false;
      return;
    }

    if (authLoading || recoveryMode) return;
    if (redirectedRef.current) return;

    redirectedRef.current = true;

    const fromPath = (location.state as any)?.from?.pathname;
    const safeFrom = typeof fromPath === "string" && fromPath !== "/auth" ? fromPath : null;

    const doRedirect = async () => {
      try {
        const { data, error } = await supabase.rpc("has_role", {
          _user_id: session.user.id,
          _role: "admin",
        });

        // Always redirect to home page after sign-in
        navigate("/", { replace: true });
      } catch {
        navigate(safeFrom ?? "/trading", { replace: true });
      }
    };

    // Defer any backend calls/navigation out of render cycle
    setTimeout(() => void doRedirect(), 0);
  }, [authLoading, recoveryMode, session?.user?.id, navigate, location.state]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = authSchema.parse({ email, password, fullName });

      const { data, error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: validated.fullName,
          },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already") || error.message.toLowerCase().includes("registered")) {
          toast.error("This email is already registered. Please sign in instead.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      // If email confirmation is required, session will be null.
      if (!data.session) {
        toast.success("Account created. Check your email to confirm, then sign in.");
      } else {
        toast.success("Account created — signing you in…");
        navigate("/");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = authSchema.pick({ email: true, password: true }).parse({ email, password });

      const { error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) {
        const msg = error.message.toLowerCase();

        if (msg.includes("invalid login credentials")) {
          toast.error("Invalid email or password. If you forgot it, use password reset.");
        } else if (msg.includes("email not confirmed")) {
          toast.error("Please confirm your email first, then sign in.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Signed in");
      navigate("/");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    // Check if email is provided BEFORE starting
    if (!email || !email.trim()) {
      toast.error("Please enter your email address first, then click 'Forgot password?'");
      return;
    }

    setIsLoading(true);

    try {
      const validatedEmail = authSchema.shape.email.parse(email.trim());

      const { error } = await supabase.auth.resetPasswordForEmail(validatedEmail, {
        // If your backend is configured to only allow the root URL, our App-level deep link handler
        // will forward the recovery hash safely back to /auth.
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("rate limit") || msg.includes("for security purposes") || msg.includes("too many")) {
          toast.error("Too many attempts. Please wait ~1 minute and try again.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      setPasswordResetSentTo(validatedEmail);
      toast.success("Password reset email sent! Check your inbox (and spam folder) to set a new password.");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error("Please enter a valid email address first.");
      } else {
        toast.error("Enter your email address in the field above, then click 'Forgot password?'");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validatedPassword = authSchema.shape.password.parse(newPassword);

      if (validatedPassword !== confirmNewPassword) {
        toast.error("Passwords do not match");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: validatedPassword });

      if (error) {
        toast.error(error.message);
        return;
      }

      // Remove recovery tokens from the URL
      window.history.replaceState(null, "", "/auth");

      toast.success("Password updated — you're signed in");
      setRecoveryMode(false);
      navigate("/");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <h1 className="sr-only">AIQTP Platform Sign In</h1>

      <section className="w-full max-w-md relative z-10">
        <Card>
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="h-6 w-6 text-primary" />
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {recoveryMode ? "Reset Password" : "AIQTP Platform"}
            </CardTitle>
            <CardDescription>
              {recoveryMode
                ? "Set a new password to regain access."
                : "Secure AI-powered quantum trading"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {recoveryMode ? (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Updating…" : "Update Password"}
                </Button>

                <Button
                  type="button"
                  variant="link"
                  className="w-full"
                  onClick={() => {
                    setRecoveryMode(false);
                    window.history.replaceState(null, "", "/auth");
                  }}
                  disabled={isLoading}
                >
                  Back to sign in
                </Button>
              </form>
            ) : (
              <>
                {/* Google OAuth */}
                <Button
                  variant="outline"
                  className="w-full mb-2"
                  onClick={async () => {
                    const result = await lovable.auth.signInWithOAuth("google", {
                      redirect_uri: window.location.origin,
                    });

                    if (result?.error) {
                      toast.error(result.error.message || "Google sign-in failed. Please try again.");
                    }
                  }}
                  disabled={isLoading}
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>

                {/* Apple OAuth */}
                <Button
                  variant="outline"
                  className="w-full mb-4"
                  onClick={async () => {
                    const result = await lovable.auth.signInWithOAuth("apple", {
                      redirect_uri: window.location.origin,
                    });

                    if (result?.error) {
                      toast.error(result.error.message || "Apple sign-in failed. Please try again.");
                    }
                  }}
                  disabled={isLoading}
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Continue with Apple
                </Button>

                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                  </div>
                </div>

                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setPasswordResetSentTo(null);
                          }}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="signin-password">Password</Label>
                          <Button
                            type="button"
                            variant="link"
                            className="h-auto px-0"
                            onClick={handleRequestPasswordReset}
                            disabled={isLoading}
                          >
                            Forgot password?
                          </Button>
                        </div>
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                        {passwordResetSentTo ? (
                          <p className="text-xs text-muted-foreground">
                            Reset link sent to <span className="font-medium">{passwordResetSentTo}</span>. Open the email and return here to set a new password.
                          </p>
                        ) : null}
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Signing in…" : "Sign In"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Full Name</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setPasswordResetSentTo(null);
                          }}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                      </div>

                      {/* Required Acknowledgments */}
                      <div className="space-y-2 border border-border/50 rounded-lg p-3 bg-muted/20">
                        <p className="text-xs font-medium text-foreground">Required Acknowledgments</p>
                        <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            required
                            className="mt-0.5 accent-primary"
                            disabled={isLoading}
                          />
                          <span>I understand trading involves substantial risk of loss. I am trading with funds I can afford to lose. AI predictions are experimental.</span>
                        </label>
                        <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            required
                            className="mt-0.5 accent-primary"
                            disabled={isLoading}
                          />
                          <span>
                            I agree to the{" "}
                            <a href="/legal" target="_blank" className="text-primary underline">Terms of Service, Privacy Policy & Risk Disclosures</a>.
                            AIQTP does not provide financial advice.
                          </span>
                        </label>
                      </div>

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Creating account…" : "Create Account"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Sign in with Google or Apple for the fastest experience.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default Auth;
