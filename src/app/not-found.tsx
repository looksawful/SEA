import Image from "next/image";
import { Card } from "@/components/Card";
import { LinkButton } from "@/components/LinkButton";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-lg text-center space-y-4">
        <Image src="/brand/logo-mark.svg" alt="" width={48} height={48} className="h-12 w-12 mx-auto" />
        <div className="space-y-1">
          <h1 className="text-2xl font-display font-semibold">Страница не найдена</h1>
          <p className="text-sm text-muted">Похоже, вы перешли по устаревшей ссылке.</p>
        </div>
        <LinkButton href="/" fullWidth>
          Вернуться на главную
        </LinkButton>
      </Card>
    </div>
  );
}
