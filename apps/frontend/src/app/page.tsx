"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/contexts/I18nContext";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { tCommon } = useTranslation();

  useEffect(() => {
    const checkAuthAndRedirect = () => {
      const hasAuth = localStorage.getItem("access_token");

      if (hasAuth) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    };

    // Small delay to prevent flash
    setTimeout(() => {
      checkAuthAndRedirect();
      setIsLoading(false);
    }, 100);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{tCommon('loading')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
