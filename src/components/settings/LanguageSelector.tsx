import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe, Search, Check } from "lucide-react";

const LanguageSelector = () => {
  const { language, setLanguage, languages } = useLanguage();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const currentLang = languages.find(l => l.code === language);
  
  const filteredLanguages = languages.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.nativeName.toLowerCase().includes(search.toLowerCase()) ||
    l.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (code: string) => {
    setLanguage(code);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          {currentLang?.nativeName || 'English'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Select Language
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search 100+ languages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-1">
            {filteredLanguages.map((lang) => (
              <Button
                key={lang.code}
                variant={language === lang.code ? 'secondary' : 'ghost'}
                className="w-full justify-between"
                onClick={() => handleSelect(lang.code)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{lang.rtl ? '🔄' : ''}</span>
                  <div className="text-left">
                    <p className="font-medium">{lang.nativeName}</p>
                    <p className="text-xs text-muted-foreground">{lang.name}</p>
                  </div>
                </div>
                {language === lang.code && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </Button>
            ))}
          </div>
        </ScrollArea>

        <p className="text-xs text-muted-foreground text-center">
          {languages.length} languages available • RTL support included
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default LanguageSelector;
