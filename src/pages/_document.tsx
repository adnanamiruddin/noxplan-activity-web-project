import { Head, Html, Main, NextScript } from "next/document";
import { APP_DESCRIPTION } from "@/const/app";

export default function Document() {
  return (
    <Html lang="id" data-theme="noxplan">
      <Head>
        <meta name="description" content={APP_DESCRIPTION} />
        <meta name="theme-color" content="#107c41" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
