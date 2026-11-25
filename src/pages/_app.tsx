import "nprogress/nprogress.css";
import "@/styles/globals.css";
import { useEffect } from "react";
import type { AppProps } from "next/app";
import Head from "next/head";
import Router from "next/router";
import NProgress from "nprogress";
import AppShell from "@/components/AppShell";
import { UIProvider } from "@/components/UIContext";
import { APP_NAME } from "@/const/app";
import { PlanProvider } from "@/context/PlanContext";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    NProgress.configure({ showSpinner: false, trickleSpeed: 120, minimum: 0.15 });
    const start = () => NProgress.start(), done = () => NProgress.done();
    Router.events.on("routeChangeStart", start);
    Router.events.on("routeChangeComplete", done);
    Router.events.on("routeChangeError", done);
    return () => { Router.events.off("routeChangeStart", start); Router.events.off("routeChangeComplete", done); Router.events.off("routeChangeError", done); };
  }, []);
  return (
    <PlanProvider>
      <UIProvider>
        <Head><title>{APP_NAME}</title></Head>
        <AppShell><Component {...pageProps} /></AppShell>
      </UIProvider>
    </PlanProvider>
  );
}
