import Link from 'next/link'

export const metadata = {
  title: '隱私權政策',
  description: '熙熙初日｜日系選物店個人資料保護與隱私權政策',
}

const LAST_UPDATED = '2026-05-03'

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <p className="font-jp text-xs tracking-[0.3em] text-ink-soft mb-3">
        PRIVACY · プライバシーポリシー
      </p>
      <h1 className="font-serif text-4xl mb-3 tracking-wide">隱私權政策</h1>
      <p className="text-ink-soft text-sm mb-10">
        最後更新：{LAST_UPDATED}
      </p>

      <div className="prose prose-stone max-w-none journal-body text-ink leading-relaxed space-y-6">
        <p>
          熙熙初日｜日系選物店（以下簡稱「本店」）非常重視您的隱私權與個人資料保護。
          本政策說明本店蒐集、處理、利用您的個人資料的方式，以及您可以行使的權利。
          請您於使用本店服務前，詳閱本政策。
        </p>

        <h2>一、適用範圍</h2>
        <p>
          本政策適用於您在本店網站（包含手機與桌機版本）、
          LINE 官方帳號、Email 通訊及任何由本店營運之服務管道之資料蒐集行為。
          不適用於本店連結之第三方網站（例如品牌官網、綠界金流頁面等），
          該等網站之隱私政策請參閱其各自之公告。
        </p>

        <h2>二、蒐集之個人資料項目</h2>
        <p>本店依您使用之功能，會蒐集以下類別之個人資料：</p>
        <ul>
          <li>
            <strong>會員與訂單資料</strong>：姓名、Email、電話、配送地址、
            LINE User ID（如使用 LINE 登入或加好友）、Google 帳號名稱（如使用 Google 登入）
          </li>
          <li>
            <strong>交易資料</strong>：訂購項目、金額、付款方式、發票資訊、
            收件人姓名與電話（若與訂購人不同）
          </li>
          <li>
            <strong>寶寶資訊（選填）</strong>：寶寶月齡或出生年月，
            僅用於商品推薦與通知
          </li>
          <li>
            <strong>裝置與瀏覽資料</strong>：IP 位址、瀏覽器類型、來源頁、
            造訪時間、Cookie（含偏好設定、購物車狀態）
          </li>
          <li>
            <strong>客戶服務紀錄</strong>：您透過 LINE、Email、客服表單提交的內容
          </li>
        </ul>

        <h2>三、資料蒐集之目的</h2>
        <ul>
          <li>處理訂單、配送、付款、發票開立</li>
          <li>會員身份驗證與會員中心服務</li>
          <li>商品到貨、出貨、訂單狀態變更通知（透過 LINE 與 Email）</li>
          <li>客戶服務、退換貨處理、爭議處理</li>
          <li>網站功能改善、流量分析</li>
          <li>依您訂閱意願寄送選物通知與電子報（可隨時退訂）</li>
          <li>法令遵循（如稅務申報、消費爭議協調、犯罪調查協助等）</li>
        </ul>

        <h2>四、個人資料之利用期間、地區、對象</h2>
        <p>
          本店個人資料儲存與處理伺服器位於 <strong>美國 / 新加坡</strong>
          （Supabase 所在區域）與 <strong>台灣</strong>（部份備援）。
          資料保存期間為您與本店往來關係存續期間，
          並於您主張刪除或法定保存期間屆滿後刪除（會計憑證依《商業會計法》保存 5 年、
          稅務憑證依《稅捐稽徵法》保存 5–7 年）。
        </p>
        <p>
          本店僅於下列情形將您的個人資料提供予第三方：
        </p>
        <ul>
          <li>
            <strong>金流服務商</strong>：綠界科技 ECPay（處理付款）—
            依其隱私權政策獨立保管
          </li>
          <li>
            <strong>物流服務商</strong>：黑貓宅急便 / 7-11 交貨便（依您選擇）—
            僅提供配送所需之姓名、電話、地址
          </li>
          <li>
            <strong>通訊服務商</strong>：LINE Corp（推播訊息）、
            Resend / SendGrid（Email 寄送）— 僅提供發送通知所需資料
          </li>
          <li>
            <strong>分析服務商</strong>：Google Analytics（流量分析）—
            僅提供匿名化或假名化資料
          </li>
          <li>依法令要求或司法機關正式請求</li>
        </ul>
        <p>
          本店<strong>不會</strong>將您的個人資料出售、出租或交換予任何行銷用途之第三方。
        </p>

        <h2>五、Cookie 之使用</h2>
        <p>本店使用 Cookie 以提供以下功能：</p>
        <ul>
          <li>記住購物車內容（即使未登入）</li>
          <li>會員登入狀態保持</li>
          <li>新訪客導引（onboarding 彈窗只顯示一次）</li>
          <li>流量統計（Google Analytics）</li>
          <li>A/B 測試版本分配</li>
        </ul>
        <p>
          您可以透過瀏覽器設定停用 Cookie，但某些功能（如購物車、登入）將無法正常運作。
        </p>

        <h2>六、您的權利</h2>
        <p>依個人資料保護法第 3 條，您就您的個人資料享有以下權利：</p>
        <ul>
          <li>查詢或請求閱覽</li>
          <li>請求製給複製本</li>
          <li>請求補充或更正</li>
          <li>請求停止蒐集、處理或利用</li>
          <li>請求刪除</li>
        </ul>
        <p>
          欲行使上述權利，請來信
          <a href="mailto:hello@ccbabylife.com">hello@ccbabylife.com</a>
          或私訊本店 LINE 官方帳號。本店將於 30 日內回覆。
          請注意，部份資料（如已開立發票之交易資料）依法有保存期限，
          無法立即刪除。
        </p>

        <h2>七、資料安全</h2>
        <p>本店採取以下措施保護您的資料：</p>
        <ul>
          <li>全站 HTTPS 加密傳輸</li>
          <li>密碼採用 bcrypt 雜湊存放，本店無法還原</li>
          <li>付款資訊由綠界科技直接處理，本店伺服器<strong>不存放任何信用卡號</strong></li>
          <li>定期備份與權限分級存取</li>
        </ul>
        <p>
          惟網際網路傳輸無法保證 100% 安全。如您發現帳號異常，
          請立即聯繫本店客服。
        </p>

        <h2>八、未成年人資料</h2>
        <p>
          本店主要服務對象為成年人（家長 / 照顧者）。
          若您未滿 18 歲，請於法定代理人陪同、同意下使用本店服務。
          本店蒐集之「寶寶月齡 / 生日」屬該未成年寶寶之資料，
          請會員（家長）在註冊前確認您具有監護權。
        </p>

        <h2>九、政策修訂</h2>
        <p>
          本店得隨時修訂本政策，並於本網站公告生效日期。
          重大變更將透過 Email 或 LINE 通知會員。
          您於變更後繼續使用本店服務，即視為同意修訂後之政策。
        </p>

        <h2>十、聯繫資訊</h2>
        <p>
          熙熙初日｜日系選物店<br />
          統一編號：60766849<br />
          Email：<a href="mailto:hello@ccbabylife.com">hello@ccbabylife.com</a><br />
          LINE 官方帳號：@ccbabylife（待認證）
        </p>
      </div>

      <div className="mt-16 pt-8 border-t border-line text-sm text-ink-soft">
        <Link href="/about" className="hover:text-accent font-jp">
          ← 関於本店 · 關於我們
        </Link>
      </div>
    </div>
  )
}
