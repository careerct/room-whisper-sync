import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/chat");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignIn) {
      await signIn(email, password);
    } else {
      await signUp(email, password, username);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-dark">
          {/* Logo and Title */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-purple">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent mb-2">
              Chat Server
            </h1>
            <p className="text-muted-foreground text-center">
              Professional multithreaded chat with real-time messaging
            </p>
          </div>

          {/* Toggle Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-secondary rounded-lg">
            <Button
              type="button"
              variant={isSignIn ? "default" : "ghost"}
              onClick={() => setIsSignIn(true)}
              className="rounded-md"
            >
              Sign In
            </Button>
            <Button
              type="button"
              variant={!isSignIn ? "default" : "ghost"}
              onClick={() => setIsSignIn(false)}
              className="rounded-md"
            >
              Sign Up
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isSignIn && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-input border-border"
                  required={!isSignIn}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input border-border"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full gradient-primary shadow-purple">
              {isSignIn ? "Sign In" : "Sign Up"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
