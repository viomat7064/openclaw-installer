import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LanguageSwitch() {
  const { i18n } = useTranslation();

  const toggle = () => {
    const next = i18n.language === "zh" ? "en" : "zh";
    i18n.changeLanguage(next);
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggle} className="gap-1.5">
      <Languages className="h-4 w-4" />
      {i18n.language === "zh" ? "EN" : "中文"}
    </Button>
  );
}
