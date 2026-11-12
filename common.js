/* Shared helpers for the career pages: same seeded dataset as the SQL edition, SQL runner, result checker. */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

const TABLES={
  stores:['store_id INTEGER PRIMARY KEY','name TEXT','city TEXT','open_date TEXT'],
  products:['product_id INTEGER PRIMARY KEY','name TEXT','category TEXT','price INTEGER','cost INTEGER'],
  customers:['customer_id INTEGER PRIMARY KEY','name TEXT','city TEXT','signup_date TEXT','member_tier TEXT'],
  coupons:['coupon_code TEXT PRIMARY KEY','campaign TEXT','discount TEXT','start_date TEXT','end_date TEXT'],
  orders:['order_id INTEGER PRIMARY KEY','customer_id INTEGER','store_id INTEGER','order_date TEXT','channel TEXT','coupon_code TEXT'],
  order_items:['order_id INTEGER','product_id INTEGER','qty INTEGER','unit_price INTEGER'],
  app_events:['event_id INTEGER PRIMARY KEY','session_id INTEGER','user_id INTEGER','platform TEXT','app_version TEXT','event_name TEXT','event_date TEXT']
};
const TABLE_NOTES={
  stores:'門市：store_id, name, city, open_date',
  products:'品項：product_id, name, category, price, cost',
  customers:'會員：customer_id, name, city, signup_date, member_tier（一般 / 銀卡 / 金卡）',
  orders:'訂單：order_id, customer_id（散客為 NULL）, store_id, order_date, channel（門市 / 外送 / App自取）, coupon_code',
  order_items:'訂單明細：order_id, product_id, qty, unit_price（實收單價）',
  coupons:'優惠活動：coupon_code, campaign, discount, start_date, end_date',
  app_events:'App 行為：event_id, session_id, user_id, platform, app_version, event_name, event_date'
};

function genData(){
  const R=mulberry32(20261109);
  const pick=a=>a[Math.floor(R()*a.length)];
  const wpick=(items,w)=>{let s=0;for(const x of w)s+=x;let r=R()*s;for(let i=0;i<items.length;i++){r-=w[i];if(r<0)return items[i]}return items[items.length-1]};
  const day=864e5, ds=t=>new Date(t).toISOString().slice(0,10);
  const D={stores:[],products:[],customers:[],coupons:[],orders:[],order_items:[],app_events:[]};
  const STORES=[[1,'台北信義店','台北','2023-03-01',16],[2,'台北中山店','台北','2024-06-15',12],[3,'台中勤美店','台中','2023-09-10',13],[4,'高雄駁二店','高雄','2025-01-20',9],[5,'新竹巨城店','新竹','2025-08-01',8]];
  STORES.forEach(s=>D.stores.push(s.slice(0,4)));
  const PROD=[[1,'經典紅茶','純茶',35,8],[2,'茉莉綠茶','純茶',35,8],[3,'烏龍青茶','純茶',40,10],[4,'珍珠鮮奶茶','鮮奶茶',65,22],[5,'芋泥鮮奶','鮮奶茶',75,28],[6,'黑糖鮮奶','鮮奶茶',70,24],[7,'抹茶拿鐵','鮮奶茶',80,30],[8,'百香綠茶','果茶',55,18],[9,'芒果冰沙','果茶',85,32],[10,'檸檬多多','果茶',60,20],[11,'冬瓜檸檬','果茶',50,15],[12,'珍珠加料','加料',10,3]];
  PROD.forEach(p=>D.products.push(p.slice()));
  D.coupons.push(['SUMMER20','夏日全品項 8 折','全品項 8 折','2026-07-01','2026-08-31'],['NEW10','會員 9 折','全品項 9 折','2026-01-01','2026-12-31'],['MILK50','App 鮮奶茶半價','鮮奶茶 5 折（限 App 自取）','2026-10-01','2026-10-31']);
  const SUR='陳林黃張李王吳劉蔡楊許鄭謝郭洪曾邱廖賴周'.split('');
  const GIV=['怡君','雅婷','家豪','志明','淑芬','宗翰','冠宇','欣怡','承恩','品妍','柏翰','詩涵','俊傑','佳穎','宥廷','子晴','建宏','美玲','偉倫','思妤'];
  const CITIES=['台北','台中','高雄','新竹','桃園'];
  const byCity={}, all=[];
  for(let i=1;i<=600;i++){
    const city=wpick(CITIES,[40,20,15,13,12]);
    D.customers.push([i,pick(SUR)+pick(GIV),city,ds(Date.UTC(2025,0,1)+Math.floor(R()*546)*day),wpick(['一般','銀卡','金卡'],[70,22,8])]);
    (byCity[city]=byCity[city]||[]).push(i); all.push(i);
  }
  const MF={7:1.08,8:1.12,9:1.0,10:0.95}, MF5={7:0.72,8:0.85,9:1.0,10:1.12};
  const BASEW=[8,7,6,12,6,8,5,7,5,6,6,4];
  const weights=(sid,m)=>{const w=BASEW.slice();
    if(sid===3)w[4]=20; if(sid===3&&m===10)w[4]=0;
    if(sid===4)w[10]=16; if(sid===5)w[5]=16;
    if(m===7||m===8)w[8]*=2; if(m===10)w[8]*=0.5; return w};
  const PIDS=PROD.map(p=>p[0]), MILK=[4,5,6,7];
  let oid=1; const D0=Date.UTC(2026,6,1);
  for(let d=0;d<123;d++){
    const t=D0+d*day, date=ds(t), dt=new Date(t), m=dt.getUTCMonth()+1, wd=dt.getUTCDay();
    const wkf=(wd===0||wd===6)?1.3:1;
    for(const s of STORES){
      const sid=s[0]; let f=(sid===5?MF5:MF)[m]; if(sid===3&&m===10)f*=0.62;
      const n=Math.round(s[4]*f*wkf*(0.8+R()*0.4)); const w=weights(sid,m);
      for(let k=0;k<n;k++){
        const channel=wpick(['門市','外送','App自取'],[55,25,20]);
        let cust=null;
        if(channel==='App自取'||R()<0.62){const pool=(R()<0.85&&byCity[s[2]])?byCity[s[2]]:all;cust=pick(pool)}
        let coupon=null;
        if(channel==='App自取'&&m===10&&R()<0.6)coupon='MILK50';
        else if(m<=8&&R()<0.18)coupon='SUMMER20';
        else if(cust&&R()<0.05)coupon='NEW10';
        const nItems=wpick([1,2,3,4],channel==='外送'?[22,40,24,14]:[52,30,13,5]);
        const lines=new Map();
        for(let i=0;i<nItems;i++){
          const p=(i===0&&coupon==='MILK50')?wpick(MILK,MILK.map(id=>w[id-1])):wpick(PIDS,w);
          lines.set(p,(lines.get(p)||0)+wpick([1,2],[82,18]));
        }
        D.orders.push([oid,cust,sid,date,channel,coupon]);
        for(const [p,q] of lines){
          const pr=PROD[p-1]; let disc=1;
          if(coupon==='SUMMER20')disc=0.8; else if(coupon==='NEW10')disc=0.9; else if(coupon==='MILK50'&&pr[2]==='鮮奶茶')disc=0.5;
          D.order_items.push([oid,p,q,Math.round(pr[3]*disc)]);
        }
        oid++;
      }
    }
  }
  const STEPS=['open_app','view_menu','add_to_cart','checkout','payment_success'];
  let eid=1;
  for(let sid=1;sid<=3000;sid++){
    const plat=R()<0.5?'iOS':'Android', dd=1+Math.floor(R()*31), date='2026-10-'+String(dd).padStart(2,'0');
    const ver=(plat==='Android'&&dd>=15)?'5.3.0':'5.2.0', uid=1+Math.floor(R()*600);
    const p=[1,0.82,0.46,0.72,plat==='iOS'?0.93:(ver==='5.3.0'?0.56:0.91)];
    for(let i=0;i<5;i++){
      if(R()>=p[i])break;
      D.app_events.push([eid++,sid,uid,plat,ver,STEPS[i],date]);
      if((i===1&&R()<0.3)||(i===2&&R()<0.25)) D.app_events.push([eid++,sid,uid,plat,ver,STEPS[i],date]);
    }
  }
  return D;
}

async function openDB(){
  if(typeof initSqlJs!=='function')throw new Error('SQL 引擎沒有載入成功');
  const SQL=await initSqlJs(), db=new SQL.Database(), D=genData();
  db.exec(Object.entries(TABLES).map(([t,c])=>`CREATE TABLE ${t}(${c.join(',')});`).join('\n'));
  db.exec('BEGIN');
  for(const [t,cols] of Object.entries(TABLES)){
    const st=db.prepare(`INSERT INTO ${t} VALUES (${cols.map(()=>'?').join(',')})`);
    D[t].forEach(r=>st.run(r)); st.free();
  }
  db.exec('COMMIT');
  return db;
}
function runSQL(db,sql){try{const r=db.exec(sql);return {res:r.length?r[r.length-1]:null}}catch(e){return {err:e.message}}}
function explainErr(m){
  let x;
  if((x=m.match(/no such column: (\S+)/)))return `找不到欄位「${esc(x[1])}」。檢查拼字，或確認這個欄位在你 FROM / JOIN 的資料表裡。`;
  if((x=m.match(/no such table: (\S+)/)))return `找不到資料表「${esc(x[1])}」。`;
  if((x=m.match(/ambiguous column name: (\S+)/)))return `欄位「${esc(x[1])}」有歧義：好幾張表都有這個欄位，請加上表名或別名。`;
  if(/misuse of window function/.test(m))return '視窗函數不能直接寫在 WHERE 或 GROUP BY，請先包進子查詢或 CTE。';
  if(/misuse of aggregate/.test(m))return '聚合函數不能放在 WHERE，分組後的篩選請用 HAVING。';
  if((x=m.match(/near "(.+?)": syntax error/)))return `語法錯誤，問題在「${esc(x[1])}」附近。`;
  if(/incomplete input/.test(m))return '查詢好像沒寫完，檢查括號或引號有沒有成對。';
  return 'SQLite 回報了一個錯誤。';
}
function errHTML(m){return `<div class="fb bad">${explainErr(m)}<span class="raw">${esc(m)}</span></div>`}
function eq(a,b){
  if(a===null||b===null)return a===b;
  if(typeof b==='number'){const x=typeof a==='number'?a:parseFloat(a);if(!isFinite(x))return false;return Math.abs(x-b)<=Math.max(0.006,Math.abs(b)*0.004)}
  return String(a).trim()===String(b).trim();
}
const rowKey=r=>r.map(x=>x===null?'~':typeof x==='number'?x.toFixed(2):String(x).trim()).join('\u0001');
const sortRows=v=>[...v].sort((a,b)=>{const x=rowKey(a),y=rowKey(b);return x<y?-1:x>y?1:0});
function diffRows(U,E){for(let i=0;i<E.length;i++)for(let j=0;j<E[i].length;j++)if(!eq(U[i][j],E[i][j]))return [i,j];return null}
function checkResult(u,e,ordered){
  if(!u)return '最後一句查詢沒有回傳資料。';
  if(u.columns.length!==e.columns.length)return `欄位數不符：需要 ${e.columns.length} 欄，你的結果有 ${u.columns.length} 欄。`;
  if(u.values.length!==e.values.length)return `列數不符：預期 ${e.values.length} 列，你的結果有 ${u.values.length} 列。`;
  const d0=diffRows(sortRows(u.values),sortRows(e.values));
  if(!d0){if(ordered&&diffRows(u.values,e.values))return '數值都對了，但排序不符合要求。';return null}
  const U=ordered?u.values:sortRows(u.values),E=ordered?e.values:sortRows(e.values);
  const [i,j]=diffRows(U,E)||d0;
  return `第 ${i+1} 列第 ${j+1} 欄的值不符合。`;
}
function tableHTML(res,limit=200){
  if(!res)return '<p class="meta">查詢已執行，沒有回傳資料列。</p>';
  const rows=res.values.slice(0,limit);
  return `<div class="tbl-wrap"><table><thead><tr>${res.columns.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>v===null?'<td><span class="nul">NULL</span></td>':`<td class="${typeof v==='number'?'num':''}">${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="meta">共 ${res.values.length} 列${res.values.length>limit?`，只顯示前 ${limit} 列`:''}</p>`;
}
function editorKeys(ed,run){
  ed.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();run()}
    else if(e.key==='Tab'&&!e.shiftKey){e.preventDefault();const s=ed.selectionStart;ed.setRangeText('  ',s,ed.selectionEnd,'end');ed.dispatchEvent(new Event('input'))}
  });
}
function loadState(key,blank){try{const s=JSON.parse(localStorage.getItem(key));if(s&&typeof s==='object')return Object.assign(blank,s)}catch(e){}return blank}
function saveState(key,s){try{localStorage.setItem(key,JSON.stringify(s))}catch(e){}}
let _tt;function toast(msg){const t=$('#toast');if(!t)return;t.textContent=msg;t.hidden=false;clearTimeout(_tt);_tt=setTimeout(()=>t.hidden=true,2400)}
function downloadText(name,text,type){
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:type||'text/plain;charset=utf-8'}));a.download=name;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
async function copyText(text){try{await navigator.clipboard.writeText(text);toast('已複製')}catch(e){toast('複製失敗，請手動選取文字')}}
function siteNav(cur){
  const items=[['./','SQL 篇'],['./pandas.html','Pandas 篇'],['./powerbi.html','Power BI 篇'],['./industry.html','產業篇'],['./interview.html','面試模擬'],['./project.html','結業專案']];
  return `<nav class="sitenav" aria-label="網站導覽">${items.map(([h,t])=>`<a href="${h}" ${t===cur?'aria-current="page"':''}>${t}</a>`).join('')}</nav>`;
}
