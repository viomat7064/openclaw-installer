import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Package, Container, Check } from "lucide-react";
import { WizardLayout } from "@/components/WizardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWizard, type InstallMode } from "@/context/WizardContext";
import { cn } from "@/lib/utils";

interface ModeCardProps {
  mode: InstallMode;
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  badge: string;
  badgeVariant: "success" | "secondary";
  desc: string;
  features: string[];
}

function ModeCard({ selected, onSelect, icon, title, badge, badgeVariant, desc, features }: ModeCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        selected && "ring-2 ring-primary border-primary"
      )}
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant={badgeVariant} className="mt-1">{badge}</Badge>
          </div>
        </div>
        <CardDescription className="mt-2">{desc}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function ModeSelect() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { installMode, setInstallMode } = useWizard();

  const npmFeatures = t("modeSelect.npm.features", { returnObjects: true }) as string[];
  const dockerFeatures = t("modeSelect.docker.features", { returnObjects: true }) as string[];

  return (
    <WizardLayout step={2}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">{t("modeSelect.title")}</h2>
          <p className="text-muted-foreground">{t("modeSelect.subtitle")}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ModeCard
            mode="npm"
            selected={installMode === "npm"}
            onSelect={() => setInstallMode("npm")}
            icon={<Package className="h-8 w-8 text-blue-500" />}
            title={t("modeSelect.npm.title")}
            badge={t("modeSelect.npm.badge")}
            badgeVariant="success"
            desc={t("modeSelect.npm.desc")}
            features={npmFeatures}
          />
          <ModeCard
            mode="docker"
            selected={installMode === "docker"}
            onSelect={() => setInstallMode("docker")}
            icon={<Container className="h-8 w-8 text-cyan-500" />}
            title={t("modeSelect.docker.title")}
            badge={t("modeSelect.docker.badge")}
            badgeVariant="secondary"
            desc={t("modeSelect.docker.desc")}
            features={dockerFeatures}
          />
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
            {t("modeSelect.back")}
          </Button>
          <Button onClick={() => navigate("/dependency-install")} disabled={!installMode}>
            {t("modeSelect.next")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </WizardLayout>
  );
}
