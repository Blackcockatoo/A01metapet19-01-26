'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowDownToLine,
  ArrowLeft,
  Dna,
  Home,
  PawPrint,
  QrCode,
  UserCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/pet', label: 'Pet', icon: PawPrint },
  { href: '/identity', label: 'Identity', icon: UserCircle },
  { href: '/qr-messaging', label: 'QR', icon: QrCode },
  { href: '/genome-explorer', label: 'Genome', icon: Dna },
];

export function QuickNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/');
  }, [router]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const showInstall = useMemo(() => installPrompt !== null, [installPrompt]);

  const handleInstall = useCallback(async () => {
    if (!installPrompt) {
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setInstallPrompt(null);
    }
  }, [installPrompt]);

  return (
    <div className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-950/80 px-3 py-2 shadow-lg shadow-slate-950/40 backdrop-blur">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="h-14 w-14 rounded-full text-slate-200 hover:bg-slate-800/80 touch-manipulation"
          aria-label="Go back"
          title="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="h-6 w-px bg-slate-700/70" />
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-14 w-14 rounded-full text-slate-200 hover:bg-slate-800/80 data-[active=true]:bg-cyan-500/20 data-[active=true]:text-cyan-200 touch-manipulation"
                data-active={isActive}
                aria-label={item.label}
                title={item.label}
              >
                <Icon className="h-5 w-5" />
              </Button>
            </Link>
          );
        })}
        {showInstall ? (
          <>
            <div className="h-6 w-px bg-slate-700/70" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleInstall}
              className="h-11 w-11 rounded-full text-slate-200 hover:bg-slate-800/80 touch-manipulation"
              aria-label="Install app"
              title="Install app"
            >
              <ArrowDownToLine className="h-5 w-5" />
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
