"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { NotificationBanner } from "@/components/ui/notification-banner";
import {
  parseNotificationFromSearchParams,
  stripNotificationParams,
  type NotificationPayload,
} from "@/lib/notifications/types";

type ActiveNotification = NotificationPayload & {
  id: number;
};

type NotificationContextValue = {
  dismiss: () => void;
  notify: (payload: NotificationPayload) => void;
  notifyError: (message: string) => void;
  notifyInfo: (message: string) => void;
  notifySuccess: (message: string) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }

  return context;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState<ActiveNotification | null>(null);
  const idRef = useRef(0);
  const lastUrlSignatureRef = useRef<string | null>(null);

  const dismiss = useCallback(() => {
    setActive((current) => {
      if (current?.urlParamsToClear?.length) {
        const href = stripNotificationParams(pathname, searchParams);
        router.replace(href, { scroll: false });
        lastUrlSignatureRef.current = null;
      }

      return null;
    });
  }, [pathname, router, searchParams]);

  const notify = useCallback((payload: NotificationPayload) => {
    idRef.current += 1;
    setActive({ ...payload, id: idRef.current });
  }, []);

  const notifyError = useCallback(
    (message: string) => notify({ message, tone: "error" }),
    [notify],
  );

  const notifySuccess = useCallback(
    (message: string) => notify({ message, tone: "success" }),
    [notify],
  );

  const notifyInfo = useCallback(
    (message: string) => notify({ message, tone: "info" }),
    [notify],
  );

  useEffect(() => {
    const parsed = parseNotificationFromSearchParams(searchParams);

    if (!parsed) {
      lastUrlSignatureRef.current = null;
      return;
    }

    const signature = `${pathname}?${searchParams.toString()}`;
    if (lastUrlSignatureRef.current === signature) {
      return;
    }

    lastUrlSignatureRef.current = signature;
    idRef.current += 1;
    setActive({ ...parsed, id: idRef.current });
  }, [pathname, searchParams]);

  const value = useMemo(
    () => ({ dismiss, notify, notifyError, notifyInfo, notifySuccess }),
    [dismiss, notify, notifyError, notifyInfo, notifySuccess],
  );

  return (
    <NotificationContext.Provider value={value}>
      {active ? (
        <NotificationBanner message={active.message} onDismiss={dismiss} tone={active.tone} />
      ) : null}
      {children}
    </NotificationContext.Provider>
  );
}
