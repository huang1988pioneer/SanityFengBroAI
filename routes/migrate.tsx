import { Head } from "$fresh/runtime.ts";

export default function MigratePage() {
  return (
    <>
      <Head>
        <title>鋒兄資料遷移工具 - SanityFengBroAI</title>
        <meta name="description" content="將 CSV 或 JSON 資料導入 Sanity" />
      </Head>
      <div class="migrate-page">
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
          }
          .migrate-page {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          h1 {
            color: #333;
            font-size: 32px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
          }
          .form-group {
            margin-bottom: 24px;
          }
          label {
            display: block;
            font-weight: 600;
            margin-bottom: 8px;
            color: #333;
            font-size: 14px;
          }
          select, textarea, input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e1e8ed;
            border-radius: 8px;
            font-size: 14px;
            font-family: inherit;
            transition: border-color 0.2s;
          }
          select:focus, textarea:focus, input:focus {
            outline: none;
            border-color: #667eea;
          }
          textarea {
            min-height: 200px;
            font-family: "Monaco", "Consolas", monospace;
            font-size: 13px;
          }
          .btn-group {
            display: flex;
            gap: 12px;
            margin-top: 24px;
          }
          button {
            flex: 1;
            padding: 14px 24px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
          }
          .btn-secondary {
            background: #f5f8fa;
            color: #333;
          }
          .btn-secondary:hover {
            background: #e1e8ed;
          }
          .status {
            margin-top: 20px;
            padding: 16px;
            border-radius: 8px;
            font-size: 14px;
          }
          .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
          }
          .status.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
          }
          .status.info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
          }
          .example-box {
            background: #f5f8fa;
            padding: 16px;
            border-radius: 8px;
            margin-top: 12px;
          }
          .example-box h3 {
            font-size: 14px;
            margin-bottom: 8px;
            color: #666;
          }
          .example-box pre {
            font-size: 12px;
            overflow-x: auto;
          }
          .settings-section {
            background: #fff9e6;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 24px;
            border: 2px solid #ffe066;
          }
          .settings-section h2 {
            font-size: 16px;
            margin-bottom: 12px;
            color: #cc8800;
          }
          .settings-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          @media (max-width: 768px) {
            .settings-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>

        <h1>
          🚀 鋒兄資料遷移工具
        </h1>
        <p class="subtitle">將 CSV 或 JSON 資料批量導入 Sanity</p>

        <div class="settings-section">
          <h2>🔐 Sanity 連線設定</h2>
          <div class="settings-grid">
            <div class="form-group">
              <label>Project ID</label>
              <input type="text" id="projectId" placeholder="your-project-id" />
            </div>
            <div class="form-group">
              <label>Dataset</label>
              <input type="text" id="dataset" value="production" />
            </div>
            <div class="form-group">
              <label>API Token</label>
              <input type="password" id="token" placeholder="skXXXXXXXX" />
            </div>
            <div class="form-group">
              <label>API Version</label>
              <input type="text" id="apiVersion" value="v2025-02-19" />
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>選擇鋒兄模組</label>
          <select id="module">
            <option value="">-- 請選擇 --</option>
            <option value="subscription">鋒兄訂閱 (fengbro_subscription)</option>
            <option value="food">鋒兄食品 (fengbro_food)</option>
            <option value="notes">鋒兄筆記 (fengbro_notes)</option>
            <option value="common">鋒兄常用 (fengbro_common)</option>
            <option value="images">鋒兄圖片 (fengbro_images)</option>
            <option value="videos">鋒兄影片 (fengbro_videos)</option>
            <option value="music">鋒兄音樂 (fengbro_music)</option>
            <option value="documents">鋒兄文件 (fengbro_documents)</option>
            <option value="podcast">鋒兄播客 (fengbro_podcast)</option>
            <option value="bank">鋒兄銀行 (fengbro_bank)</option>
            <option value="routine">鋒兄例行 (fengbro_routine)</option>
          </select>
        </div>

        <div class="form-group">
          <label>數據格式</label>
          <select id="format">
            <option value="csv">CSV 格式</option>
            <option value="json">JSON 格式</option>
          </select>
        </div>

        <div class="form-group">
          <label>貼上資料</label>
          <textarea id="data" placeholder="在此貼上 CSV 或 JSON 資料..."></textarea>
        </div>

        <div class="example-box">
          <h3>CSV 格式範例（鋒兄訂閱）：</h3>
          <pre>{`name,site,price,nextdate,note,account,currency,continue
Proton Drive Plus 200 GB,https://drive.proton.me,5,2026-06-15,,huang1988pioneer,USD,false
蝦皮VIP,,59,2026-06-30,台新銀行,abuhg17,TWD,true`}</pre>
        </div>

        <div class="example-box">
          <h3>JSON 格式範例（鋒兄訂閱）：</h3>
          <pre>{`[
  {
    "name": "Proton Drive Plus 200 GB",
    "site": "https://drive.proton.me",
    "price": 5,
    "nextdate": "2026-06-15",
    "account": "huang1988pioneer",
    "currency": "USD",
    "continue": false
  }
]`}</pre>
        </div>

        <div class="btn-group">
          <button class="btn-secondary" onClick={() => { (document.getElementById('data') as HTMLTextAreaElement).value = ''; }}>
            清除
          </button>
          <button class="btn-primary" id="migrateBtn">
            開始遷移
          </button>
        </div>

        <div id="status"></div>

        <script type="module" dangerouslySetInnerHTML={{__html: `
          const migrateBtn = document.getElementById('migrateBtn');
          const statusDiv = document.getElementById('status');

          migrateBtn.addEventListener('click', async () => {
            const module = document.getElementById('module').value;
            const format = document.getElementById('format').value;
            const data = document.getElementById('data').value.trim();
            const projectId = document.getElementById('projectId').value.trim();
            const dataset = document.getElementById('dataset').value.trim();
            const token = document.getElementById('token').value.trim();
            const apiVersion = document.getElementById('apiVersion').value.trim();

            if (!module) {
              showStatus('請選擇鋒兄模組', 'error');
              return;
            }
            if (!data) {
              showStatus('請輸入資料', 'error');
              return;
            }
            if (!projectId || !token) {
              showStatus('請填寫 Sanity 連線設定', 'error');
              return;
            }

            let parsedData;
            if (format === 'json') {
              try {
                parsedData = JSON.parse(data);
                if (!Array.isArray(parsedData)) {
                  showStatus('JSON 資料必須是陣列格式', 'error');
                  return;
                }
              } catch (e) {
                showStatus('JSON 格式錯誤：' + e.message, 'error');
                return;
              }
            } else {
              parsedData = data;
            }

            migrateBtn.disabled = true;
            migrateBtn.textContent = '遷移中...';
            showStatus('正在處理資料...', 'info');

            try {
              const response = await fetch('/api/migrate', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-sanity-project-id': projectId,
                  'x-sanity-dataset': dataset,
                  'x-sanity-token': token,
                  'x-sanity-api-version': apiVersion,
                },
                body: JSON.stringify({
                  module,
                  format,
                  data: parsedData,
                }),
              });

              const result = await response.json();

              if (response.ok && result.success) {
                showStatus(\`✅ 成功導入 \${result.imported} 筆資料到 Sanity！\`, 'success');
                document.getElementById('data').value = '';
              } else {
                showStatus('❌ 導入失敗：' + (result.error || '未知錯誤'), 'error');
              }
            } catch (error) {
              showStatus('❌ 網路錯誤：' + error.message, 'error');
            } finally {
              migrateBtn.disabled = false;
              migrateBtn.textContent = '開始遷移';
            }
          });

          function showStatus(message, type) {
            statusDiv.textContent = message;
            statusDiv.className = 'status ' + type;
          }
        `}} />
      </div>
    </>
  );
}
