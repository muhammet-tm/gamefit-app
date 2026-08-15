import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/api/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import Turnstile from "@/components/Turnstile";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  // Supabase enforces captcha on resetPasswordForEmail too.
  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaError, setCaptchaError] = useState("");
  const captchaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Safe to surface: whether the captcha has resolved says nothing about
    // whether the address belongs to an account, so this leaks nothing that
    // the silent-success behaviour below exists to protect.
    if (!captchaToken) {
      setCaptchaError("Please wait a moment for the security check to finish, then try again.");
      return;
    }
    setCaptchaError("");

    setLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
        captchaToken,
      });
    } catch {
      // Deliberately swallowed. Reporting failure here would tell an attacker
      // which addresses have accounts, so the same message is shown either way.
    } finally {
      setLoading(false);
      captchaRef.current?.reset();
      setSent(true);
    }
  };

  return (
    <AuthLayout
      icon={Mail}
      title="Reset password"
      subtitle="We'll send you a link to reset it"
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" />Back to log in
        </Link>
      }
    >
      {sent ? (
        <p className="text-sm text-foreground text-center">
          If an account exists with that email, you'll receive a password reset link shortly.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          {captchaError && (
            <p role="alert" className="text-sm text-destructive">{captchaError}</p>
          )}
          <Turnstile
            ref={captchaRef}
            className="flex justify-center"
            onToken={setCaptchaToken}
            onError={() =>
              setCaptchaError("The security check could not load. Disable any ad blocker and refresh.")}
          />
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
