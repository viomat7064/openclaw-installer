import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LanguageSelectorProps {
  open: boolean;
  onSelect: (lang: string) => void;
}

export function LanguageSelector({ open, onSelect }: LanguageSelectorProps) {
  const { i18n } = useTranslation();

  const handleSelect = (lang: string) => {
    localStorage.setItem("preferredLanguage", lang);
    i18n.changeLanguage(lang);
    onSelect(lang);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      // Only allow closing after language is selected
      if (!isOpen && localStorage.getItem("preferredLanguage")) {
        onSelect(localStorage.getItem("preferredLanguage")!);
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Language / 选择语言</DialogTitle>
          <DialogDescription>
            Choose your preferred language for the installation wizard
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-4 justify-center py-6">
          <Button
            size="lg"
            variant="outline"
            onClick={() => handleSelect("en")}
            className="w-32"
          >
            English
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => handleSelect("zh")}
            className="w-32"
          >
            中文
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
