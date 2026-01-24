"use client";
import { useEffect } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LinkButton } from "@/components/LinkButton";
import { useGameStore } from "@/store/gameStore";
import { t } from "@/utils/i18n";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const { language } = useGameStore();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-lg text-center space-y-4 shadow-card">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
            {t(language, "errorTitle")}
          </h1>
          <p className="text-sm text-muted">{t(language, "errorDescription")}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset}>{t(language, "retry")}</Button>
          <LinkButton href="/" variant="secondary" fullWidth>
            {t(language, "goHome")}
          </LinkButton>
        </div>
      </Card>
    </div>
  );
}
