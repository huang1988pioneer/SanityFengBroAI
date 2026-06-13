import { Head } from "$fresh/runtime.ts";

export default function Home() {
  return (
    <>
      <Head>
        <title>鋒兄 AI CRUD 工作台</title>
        <meta
          name="description"
          content="Deno Fresh 版本的鋒兄 AI CRUD、CSV 匯入匯出與本地資料管理工作台。"
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}>
        <div style={{
          maxWidth: "600px",
          background: "white",
          borderRadius: "16px",
          padding: "40px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          textAlign: "center",
        }}>
          <h1 style={{
            fontSize: "42px",
            marginBottom: "16px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            🎯 鋒兄 AI 工作台
          </h1>
          <p style={{
            color: "#666",
            marginBottom: "40px",
            fontSize: "16px",
          }}>
            Deno Fresh + Sanity CRUD 資料管理系統
          </p>
          
          <div style={{
            display: "grid",
            gap: "16px",
          }}>
            <a
              href="/app"
              style={{
                display: "block",
                padding: "20px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                textDecoration: "none",
                borderRadius: "12px",
                fontSize: "18px",
                fontWeight: "600",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(102, 126, 234, 0.4)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              📊 開始使用 CRUD 工作台
            </a>
          </div>

          <div style={{
            marginTop: "40px",
            padding: "20px",
            background: "#f5f8fa",
            borderRadius: "12px",
            textAlign: "left",
          }}>
            <h3 style={{ fontSize: "16px", marginBottom: "12px", color: "#333" }}>
              ✨ 主要功能
            </h3>
            <ul style={{ 
              listStyle: "none", 
              padding: 0,
              margin: 0,
              color: "#666",
              fontSize: "14px",
              lineHeight: "1.8",
            }}>
              <li>✅ 訂閱、食品、筆記、常用帳號等多種資料模組</li>
              <li>✅ 支援新增、編輯、複製、刪除、搜尋</li>
              <li>✅ CSV 批量匯入匯出</li>
              <li>✅ Sanity 雲端資料管理</li>
            </ul>
          </div>

          <p style={{
            marginTop: "30px",
            color: "#999",
            fontSize: "13px",
          }}>
            參考專案：<a 
              href="https://github.com/goldshoot0720/fengbroaiappwrite"
              target="_blank"
              style={{ color: "#667eea" }}
            >
              goldshoot0720/fengbroaiappwrite
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
