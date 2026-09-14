import { Head } from "$fresh/runtime.ts";
import FengbroCrudApp from "../islands/FengbroCrudApp.tsx";
import { shellBootScript } from "../lib/workbench.ts";

export default function Home() {
  return (
    <>
      <Head>
        <title>鋒兄 AI CRUD 工作台</title>
        <meta
          name="description"
          content="Deno Fresh 版本的鋒兄 AI CRUD、CSV 匯入匯出與本地資料管理工作台，稜鏡終端介面。"
        />
        <meta name="color-scheme" content="dark light" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="stylesheet" href="/styles.css" />
        <script dangerouslySetInnerHTML={{ __html: shellBootScript }} />
      </Head>
      <FengbroCrudApp />
    </>
  );
}
