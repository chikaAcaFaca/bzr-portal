import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { FileTextIcon, SaveIcon, XIcon } from 'lucide-react';

interface AiToBlogProps {
  aiResponse: string;
  originalQuestion: string;
}

const BLOG_CATEGORIES = [
  'bezbednost-na-radu',
  'regulative',
  'zaštita-zdravlja',
  'procedure',
  'procena-rizika',
  'obuke-zaposlenih',
  'novosti',
  'saveti',
  'propisi'
];

export function AiToBlog({ aiResponse, originalQuestion }: AiToBlogProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('bezbednost-na-radu');
  const [tags, setTags] = useState<string>('');
  const { toast } = useToast();

  const createBlogPostMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/blog/ai-to-blog', {
        aiResponse,
        originalQuestion,
        category,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean)
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Blog post kreiran",
        description: "AI odgovor je uspešno konvertovan u blog post koji čeka na odobrenje.",
      });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom konvertovanja AI odgovora u blog post.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBlogPostMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileTextIcon size={16} />
          Konvertuj u blog post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Konvertovanje AI odgovora u blog post</DialogTitle>
          <DialogDescription>
            Kreirajte blog post od ovog AI odgovora. Post će biti sačuvan kao nacrt koji čeka odobrenje.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="question" className="text-right">
                Pitanje
              </Label>
              <Input
                id="question"
                defaultValue={originalQuestion}
                className="col-span-3"
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Kategorija
              </Label>
              <Select
                value={category}
                onValueChange={setCategory}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Izaberite kategoriju" />
                </SelectTrigger>
                <SelectContent>
                  {BLOG_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tags" className="text-right">
                Tagovi
              </Label>
              <Input
                id="tags"
                placeholder="Tag1, Tag2, Tag3"
                className="col-span-3"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="preview" className="text-right pt-2">
                Preview
              </Label>
              <Textarea
                id="preview"
                className="col-span-3 h-40"
                value={aiResponse.substring(0, 300) + '...'}
                disabled
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              <XIcon size={16} className="mr-2" /> Otkaži
            </Button>
            <Button type="submit" disabled={createBlogPostMutation.isPending}>
              <SaveIcon size={16} className="mr-2" /> Sačuvaj kao blog post
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}