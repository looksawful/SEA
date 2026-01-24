"use client";
import { useEffect } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LinkButton } from "@/components/LinkButton";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-lg text-center space-y-4 shadow-card">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">Что-то пошло не так</h1>
          <p className="text-sm text-muted">Попробуйте перезапустить страницу или вернуться в меню.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset}>Попробовать снова</Button>
          <LinkButton href="/" variant="secondary" fullWidth>
            На главную
          </LinkButton>
        </div>
      </Card>
    </div>
  );
}
