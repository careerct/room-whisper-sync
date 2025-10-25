import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Lock, Zap, Shield, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Multiple Chat Rooms",
      description: "Create and join unlimited chat rooms with dynamic user management",
    },
    {
      icon: MessageCircle,
      title: "Real-time Messaging",
      description: "Lightning-fast message delivery with live presence indicators",
    },
    {
      icon: Lock,
      title: "Secure Authentication",
      description: "End-to-end encryption with secure session management",
    },
    {
      icon: Zap,
      title: "High Performance",
      description: "Multithreaded architecture handling thousands of concurrent connections",
    },
    {
      icon: Shield,
      title: "Private Messaging",
      description: "Send encrypted direct messages to individual users",
    },
    {
      icon: MessageSquare,
      title: "Message History",
      description: "Complete conversation logging with searchable archives",
    },
  ];

  return (
    <div className="min-h-screen gradient-bg">
      {/* Hero Section */}
      <header className="container mx-auto px-4 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl gradient-primary mb-8 shadow-purple">
            <MessageSquare className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Chat Server
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            A professional multithreaded chat application with real-time messaging,
            secure authentication, and advanced concurrency management
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="gradient-primary shadow-purple text-lg px-8"
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="text-lg px-8"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Enterprise-Grade Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-card border border-border rounded-xl p-6 hover:border-primary transition-all duration-300 shadow-dark hover:shadow-purple"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl p-8 shadow-dark">
          <h2 className="text-2xl font-bold mb-6 text-center">Built with Modern Technology</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold mb-3 text-primary">Core Features</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Multithreaded server architecture</li>
                <li>• Thread pool for connection management</li>
                <li>• Mutex and semaphore synchronization</li>
                <li>• Non-blocking I/O operations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-primary">Advanced Capabilities</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Real-time presence detection</li>
                <li>• Role-based access control</li>
                <li>• Message encryption & logging</li>
                <li>• Performance monitoring</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
