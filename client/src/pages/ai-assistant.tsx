import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, SendHorizontal, FileText, Upload, BookOpen, ExternalLink, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';

// Tipovi za Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const { toast } = useToast();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Inicijalizuj speech recognition
  React.useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'sr-RS';
      
      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: 'Greška',
          description: 'Greška pri prepoznavanju govora',
          variant: 'destructive'
        });
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, [toast]);

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
      
      // Automatski izgovori odgovor
      setTimeout(() => {
        speakText(data.answer);
      }, 500);
      
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

  // Text-to-speech funkcija
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Prekini trenutni govor
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Konfiguracija za mlađi muški glas - srećan i razdragan
      utterance.rate = 1.1; // Brzina govora
      utterance.pitch = 1.2; // Viši ton za mlađi zvuk
      utterance.volume = 0.8; // Glasnoća
      utterance.lang = 'sr-RS'; // Srpski jezik
      
      // Pokušaj pronaći muški glas
      const voices = window.speechSynthesis.getVoices();
      const serbianVoice = voices.find(voice => 
        voice.lang.includes('sr') || voice.lang.includes('rs')
      );
      
      if (serbianVoice) {
        utterance.voice = serbianVoice;
      }
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Speech-to-text funkcija
  const startListening = () => {
    if (recognition && !isListening) {
      setIsListening(true);
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
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
                      
                      {/* Dugme za izgovaranje odgovora */}
                      {message.role === 'assistant' && (
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => speakText(message.content)}
                            className="text-xs"
                          >
                            {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                            {isSpeaking ? 'Prekini' : 'Izgovori'}
                          </Button>
                        </div>
                      )}
                      
                      {/* Prikaz relevantnih blog postova ako postoje */}
                      {message.role === 'assistant' && message.relevantBlogPosts && message.relevantBlogPosts.length > 0 && (
                        <div className="mt-4 pt-2 border-t border-yellow-200">
                          <div 
                            className="text-sm cursor-pointer flex items-center gap-1 mt-1 text-yellow-700 hover:text-yellow-900 bg-yellow-50 p-2 rounded-md"
                            onClick={() => toggleBlogPosts(index)}
                          >
                            <BookOpen size={16} />
                            <span className="font-medium">
                              {showBlogPosts[index] ? 'Sakrij blog postove' : 'Prikaži relevantne blog postove'} ({message.relevantBlogPosts.length})
                            </span>
                          </div>
                          
                          {showBlogPosts[index] && (
                            <div className="mt-2 space-y-3 text-sm">
                              <div className="font-semibold text-yellow-800">
                                Pronađeni relevantni blog postovi o ovoj temi:
                              </div>
                              <div className="grid gap-3">
                                {message.relevantBlogPosts.map((post, postIndex) => (
                                  <Card key={postIndex} className="overflow-hidden border-yellow-200 hover:shadow-md transition-shadow duration-300">
                                    <CardHeader className="p-4 pb-2">
                                      <Link href={`/blog/${post.slug}`}>
                                        <CardTitle className="text-base font-medium text-yellow-700 hover:text-yellow-900 cursor-pointer flex items-center">
                                          {post.title}
                                          <ExternalLink size={14} className="ml-1 inline" />
                                        </CardTitle>
                                      </Link>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                      {post.excerpt && (
                                        <p className="text-muted-foreground text-xs line-clamp-2">
                                          {post.excerpt}
                                        </p>
                                      )}
                                      <div className="mt-2 flex gap-1 flex-wrap">
                                        {post.tags && post.tags.slice(0, 3).map((tag, tagIndex) => (
                                          <Badge key={tagIndex} variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                            {tag}
                                          </Badge>
                                        ))}
                                        {post.category && (
                                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                            {post.category}
                                          </Badge>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Prikaz izvora iz dokumentacije */}
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
              
              {/* Dugme za speech-to-text */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant={isListening ? "default" : "outline"}
                      className="flex-shrink-0"
                      onClick={toggleListening}
                      disabled={loading}
                    >
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isListening ? 'Prekini slušanje' : 'Govori pitanje'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Textarea
                placeholder={isListening ? "Slušam vas..." : "Postavite pitanje o bezbednosti i zdravlju na radu..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 min-h-[60px] resize-none"
                disabled={loading || isListening}
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