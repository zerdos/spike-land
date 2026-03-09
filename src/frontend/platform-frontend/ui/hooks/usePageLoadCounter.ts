import { useEffect } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { connectPageLoadCounter, finishBootstrapPageLoad } from "../../core-logic/lib/pageLoadCounter";

export function usePageLoadCounter() {
  const router = useRouter();
  const isLoading = useRouterState({ select: (state) => state.isLoading });

  useEffect(() => {
    if (!isLoading) {
      finishBootstrapPageLoad();
    }
  }, [isLoading]);

  useEffect(() => {
    return connectPageLoadCounter(router);
  }, [router]);
}
