import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, SendHorizontal, FileText, Upload, BookOpen, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { apiRequest } from '@/lib/queryClient';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Link } from 'wouter';

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  category?: string;
  tags?: string[];
};

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: {
    text: string;
    metadata: {
      filename: string;
      fileType: string;
    }
  }[];
  relevantBlogPosts?: BlogPost[];
  shouldCreateBlogPost?: boolean;
};

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSources, setShowSources] = useState<Record<number, boolean>>({});
  const [showBlogPosts, setShowBlogPosts] = useState<Record<number, boolean>>({});
  const { toast } = useToast();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (input.trim() === '') return;
    
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      const response = await fetch('/api/ai-agent/chat', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          query: input,
          createBlog: true,  // Dozvoli automatsko kreiranje bloga ako je potrebno
          checkExistingBlogs: true // Uvek proveri da li postoje postojeći blogovi
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Greška pri komunikaciji sa AI asistentom');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Greška pri dobijanju odgovora');
      }
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        sources: data.sourceDocuments,
        relevantBlogPosts: data.relevantBlogPosts,
        shouldCreateBlogPost: data.shouldCreateBlogPost
      };
      
      // Ako su pronađeni relevantni blogovi, automatski ih prikaži
      if (data.relevantBlogPosts && data.relevantBlogPosts.length > 0) {
        const messageIndex = messages.length; // Indeks nove poruke
        setShowBlogPosts(prev => ({ ...prev, [messageIndex]: true }));
      }
      
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
      
      // Ako je kreiran novi blog post, prikaži obaveštenje
      if (data.blogPost) {
        toast({
          title: "Blog post kreiran",
          description: "Vaše pitanje je kreiralo blog post koji čeka odobrenje administratora",
        });
      }
    } catch (error: any) {
      console.error('Greška:', error);
      toast({
        title: 'Greška',
        description: error.message || 'Nije moguće dobiti odgovor od AI asistenta',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSources = (index: number) => {
    setShowSources(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  const toggleBlogPosts = (index: number) => {
    setShowBlogPosts(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto">
      <div className="flex flex-col gap-6 py-8 px-4 md:px-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl font-semibold">AI Asistent za BZR</CardTitle>
            <CardDescription>
              Postavite pitanje o bezbednosti i zdravlju na radu, i dobijte odgovor baziran na zvaničnoj dokumentaciji
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4 mb-4 max-h-[60vh] overflow-y-auto p-2">
              {messages.length === 0 ? (
                <Alert>
                  <AlertTitle>Dobrodošli u BZR AI Asistenta!</AlertTitle>
                  <AlertDescription>
                    Postavite pitanje o bezbednosti i zdravlju na radu. Asistent će vam odgovoriti na osnovu baze znanja i relevantne dokumentacije.
                  </AlertDescription>
                </Alert>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${
                      message.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`px-4 py-3 rounded-lg max-w-[85%] ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-2">
                          <div 
                            className="text-xs cursor-pointer flex items-center gap-1 mt-1 text-muted-foreground"
                            onClick={() => toggleSources(index)}
                          >
                            <FileText size={14} />
                            <span>{showSources[index] ? 'Sakrij izvore' : 'Prikaži izvore'} ({message.sources.length})</span>
                          </div>
                          
                          {showSources[index] && (
                            <div className="mt-2 space-y-2 text-sm border-t pt-2">
                              <div className="font-semibold">Izvori:</div>
                              {message.sources.map((source, sourceIndex) => (
                                <div key={sourceIndex} className="bg-accent/50 p-2 rounded text-xs">
                                  <div className="font-semibold text-accent-foreground mb-1">
                                    {source.metadata.filename}
                                  </div>
                                  <div className="text-muted-foreground line-clamp-3">
                                    {source.text}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex items-center w-full gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="outline" className="flex-shrink-0">
                      <Upload size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Učitajte dokument za analizu (uskoro dostupno)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Textarea
                placeholder="Postavite pitanje o bezbednosti i zdravlju na radu..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 min-h-[60px] resize-none"
                disabled={loading}
              />
              
              <Button
                size="icon"
                className="flex-shrink-0"
                onClick={sendMessage}
                disabled={loading || input.trim() === ''}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <SendHorizontal size={18} />
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}