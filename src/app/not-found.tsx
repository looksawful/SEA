"use client";
import { Card } from "@/components/Card";
import { LinkButton } from "@/components/LinkButton";
import { useGameStore } from "@/store/gameStore";
import { t } from "@/utils/i18n";

export default function NotFound() {
  const { language } = useGameStore();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-lg text-center space-y-4 shadow-card">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
            {t(language, "notFoundTitle")}
          </h1>
          <p className="text-sm text-muted">{t(language, "notFoundDescription")}</p>
        </div>
        <LinkButton href="/" fullWidth>
          {t(language, "goHome")}
        </LinkButton>
      </Card>
    </div>
  );
}
