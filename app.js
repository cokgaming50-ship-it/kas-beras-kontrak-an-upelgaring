const KEY="kasberas_kg_v1";
const seed={members:[
{id:1,name:"Radit",room:"A-01"},
{id:2,name:"yudist",room:"A-02"},
{id:3,name:"imal",room:"C-01"},
{id:4,name:"ridi",room:"C-02"},
{id:5,name:"rohman",room:"B-01"},
{id:6,name:"fadil",room:"B-02"}],
stock:[
{id:1,date:"2026-09-04",desc:"Beras masuk 0 Kg",type:"in",kg:0},
{id:2,date:"2026-09-06",desc:"Pemakaian dapur",type:"out",kg:0},
{id:3,date:"2026-09-08",desc:"Beras masuk 0 Kg",type:"in",kg:0}
]};
let data=JSON.parse(localStorage.getItem(KEY))||seed;
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const esc=s=>String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const save=()=>localStorage.setItem(KEY,JSON.stringify(data));
const totalIn=()=>data.stock.filter(x=>x.type==="in").reduce((a,b)=>a+Number(b.kg),0);
const totalOut=()=>data.stock.filter(x=>x.type==="out").reduce((a,b)=>a+Number(b.kg),0);
const currentStock=()=>totalIn()-totalOut();
const fmtKg=n=>Number(n||0).toLocaleString("id-ID",{maximumFractionDigits:1})+" Kg";
const fmtDate=d=>new Date(d+"T00:00:00").toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"});
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2200)}
function sortedStock(){return [...data.stock].sort((a,b)=>a.date.localeCompare(b.date)||a.id-b.id)}
function stockAfter(id){let s=0;for(const x of sortedStock()){s+=x.type==="in"?Number(x.kg):-Number(x.kg);if(x.id===id)return s}return s}
function refresh(){
 const tin=totalIn(),tout=totalOut(),st=Math.max(0,currentStock());
 $("#mIn").textContent=fmtKg(tin);$("#mOut").textContent=fmtKg(tout);$("#mStock").textContent=fmtKg(st);$("#mMembers").textContent=data.members.length;
 $("#mInCount").textContent=data.stock.filter(x=>x.type==="in").length+" catatan";$("#mOutCount").textContent=data.stock.filter(x=>x.type==="out").length+" catatan";$("#mStockNote").textContent=st<=5?"⚠ Stok menipis":"Stok aman";
 $("#navMembers").textContent=data.members.length;
 const capacity=Math.max(30,tin);$("#stockPct").textContent=Math.min(100,Math.round(st/capacity*100))+"%";
 $("#stockStatusTitle").textContent=st<=5?"Stok menipis":st<=10?"Stok mulai berkurang":"Stok aman";
 $("#stockStatusText").textContent=st<=5?"Pertimbangkan mencatat beras masuk baru.":"Persediaan masih tersedia untuk digunakan.";
 renderChart();renderRecent();renderMembers();renderInPage();renderOutPage();renderStock();renderReport();updateStockUI();
}
function renderChart(){
 const months=[];const now=new Date();for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push(d.toISOString().slice(0,7))}
 const vals=months.map(m=>({m,inn:data.stock.filter(x=>x.type==="in"&&x.date.startsWith(m)).reduce((a,b)=>a+Number(b.kg),0),out:data.stock.filter(x=>x.type==="out"&&x.date.startsWith(m)).reduce((a,b)=>a+Number(b.kg),0)}));
 const mx=Math.max(...vals.flatMap(x=>[x.inn,x.out]),1);
 $("#chart").innerHTML=vals.map(x=>`<div class="chart-col"><div class="chart-bars"><div class="chart-bar in" style="height:${Math.max(4,x.inn/mx*100)}%" title="${fmtKg(x.inn)}"></div><div class="chart-bar out" style="height:${Math.max(4,x.out/mx*100)}%" title="${fmtKg(x.out)}"></div></div><small>${new Date(x.m+"-01T00:00:00").toLocaleDateString("id-ID",{month:"short"})}</small></div>`).join("");
}
function rowMovement(x,showDelete=true){const after=Math.max(0,stockAfter(x.id));return `<tr><td>${fmtDate(x.date)}</td><td><b>${esc(x.desc)}</b></td><td><span class="tag ${x.type==="in"?"income":"expense"}">${x.type==="in"?"Beras masuk":"Pemakaian"}</span></td><td><b>${x.type==="in"?"+":"−"} ${fmtKg(x.kg)}</b></td><td>${fmtKg(after)}</td>${showDelete?`<td><button class="action" onclick="delStock(${x.id})">Hapus</button></td>`:""}</tr>`}
function renderRecent(){const a=sortedStock().reverse().slice(0,5);$("#recent").innerHTML=a.map(x=>rowMovement(x,false)).join("")||"<tr><td colspan=5>Belum ada aktivitas stok.</td></tr>"}
function renderMembers(){const q=( $("#memberSearch")?.value||"").toLowerCase();const a=data.members.filter(m=>(m.name+" "+m.room).toLowerCase().includes(q));$("#memberCountLabel").textContent=data.members.length+" anggota";$("#members").innerHTML=a.map(m=>`<tr><td><b>${esc(m.name)}</b></td><td>${esc(m.room)}</td><td><span class="tag paid">Aktif</span></td><td><button class="action" onclick="delMember(${m.id})">Hapus</button></td></tr>`).join("")||"<tr><td colspan=4>Data tidak ditemukan.</td></tr>"}
function filtered(type,searchId,monthId){const q=( $(searchId)?.value||"").toLowerCase(),m=$(monthId)?.value||"";return sortedStock().filter(x=>x.type===type&&x.desc.toLowerCase().includes(q)&&(!m||x.date.startsWith(m))).reverse()}
function renderInPage(){const a=filtered("in","#inSearch","#inMonth");$("#inPageTotal").textContent=fmtKg(totalIn());$("#inPageCount").textContent=data.stock.filter(x=>x.type==="in").length;$("#inTable").innerHTML=a.map(x=>`<tr><td>${fmtDate(x.date)}</td><td>${esc(x.desc)}</td><td><span class="tag income">+ ${fmtKg(x.kg)}</span></td><td><button class="action" onclick="delStock(${x.id})">Hapus</button></td></tr>`).join("")||"<tr><td colspan=4>Tidak ada data beras masuk.</td></tr>"}
function renderOutPage(){const a=filtered("out","#outSearch","#outMonth");$("#outPageTotal").textContent=fmtKg(totalOut());$("#outPageStock").textContent=fmtKg(Math.max(0,currentStock()));$("#outTable").innerHTML=a.map(x=>`<tr><td>${fmtDate(x.date)}</td><td>${esc(x.desc)}</td><td><span class="tag expense">− ${fmtKg(x.kg)}</span></td><td><button class="action" onclick="delStock(${x.id})">Hapus</button></td></tr>`).join("")||"<tr><td colspan=4>Tidak ada data pemakaian.</td></tr>"}
function renderStock(){const a=sortedStock().reverse();$("#stockTable").innerHTML=a.map(x=>rowMovement(x,true)).join("")||"<tr><td colspan=6>Belum ada riwayat stok.</td></tr>"}
function updateStockUI(){const s=Math.max(0,currentStock());$("#stockBig").textContent=fmtKg(s);$("#stockAdvice").textContent=s<=5?"⚠ Stok menipis, pertimbangkan beras masuk baru.":"Stok masih aman untuk digunakan.";$("#stockFill").style.width=Math.min(100,s/30*100)+"%"}
function renderReport(){
 $("#rIn").textContent=fmtKg(totalIn());$("#rOut").textContent=fmtKg(totalOut());$("#rStock").textContent=fmtKg(Math.max(0,currentStock()));$("#rMembers").textContent=data.members.length;$("#reportDate").textContent="Dibuat "+new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"});
 $("#reportTable").innerHTML=sortedStock().reverse().map(x=>rowMovement(x,false)).join("")||"<tr><td colspan=5>Belum ada data.</td></tr>"
}
function open(id){$(id).classList.remove("hidden")}function close(){ $$(".modal").forEach(x=>x.classList.add("hidden"))}
function nav(page){$$('.page').forEach(x=>x.classList.add('hidden'));$('#'+page).classList.remove('hidden');$$('.nav[data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page===page));$('#pageTitle').textContent={dashboard:'Dashboard',anggota:'Anggota kontrakan',berasmasuk:'Beras masuk',pemakaian:'Pemakaian beras',stok:'Stok beras',laporan:'Laporan stok beras'}[page];$('#sidebar').classList.remove('open');scrollTo(0,0)}
$$('.nav[data-page]').forEach(x=>x.onclick=()=>nav(x.dataset.page));$$('[data-go]').forEach(x=>x.onclick=()=>nav(x.dataset.go));
$('#quickStock').onclick=$('#addStock').onclick=()=>{ $('#stType').value='in';$('#stockModalTitle').textContent='Catat stok beras';open('#stockModal') };
$('#addIn').onclick=()=>{ $('#stType').value='in';$('#stockModalTitle').textContent='Catat beras masuk';open('#stockModal') };
$('#addOut').onclick=()=>{ $('#stType').value='out';$('#stockModalTitle').textContent='Catat pemakaian beras';open('#stockModal') };
$('#addMember').onclick=()=>open('#memberModal');$$('[data-close]').forEach(x=>x.onclick=close);$$('.modal').forEach(x=>x.onclick=e=>{if(e.target===x)close()});
$('#stockForm').onsubmit=e=>{e.preventDefault();const type=$('#stType').value,kg=Number($('#stKg').value);if(type==='out'&&kg>currentStock()){alert('Pemakaian melebihi stok yang tersedia.');return}data.stock.push({id:Date.now(),date:$('#stDate').value,desc:$('#stDesc').value,type,kg});save();refresh();close();e.target.reset();$('#stDate').value=new Date().toISOString().slice(0,10);toast(type==='in'?'Beras masuk berhasil dicatat':'Pemakaian berhasil dicatat')};
$('#memberForm').onsubmit=e=>{e.preventDefault();data.members.push({id:Date.now(),name:$('#memName').value,room:$('#memRoom').value});save();refresh();close();e.target.reset();toast('Anggota berhasil ditambahkan')};
window.delStock=id=>{if(confirm('Hapus catatan stok ini?')){data.stock=data.stock.filter(x=>x.id!==id);save();refresh();toast('Catatan stok dihapus')}};
window.delMember=id=>{if(confirm('Hapus anggota ini?')){data.members=data.members.filter(x=>x.id!==id);save();refresh();toast('Anggota dihapus')}};
$('#memberSearch').oninput=renderMembers;$('#inSearch').oninput=renderInPage;$('#inMonth').onchange=renderInPage;$('#outSearch').oninput=renderOutPage;$('#outMonth').onchange=renderOutPage;$('#print').onclick=()=>window.print();
$('#menuBtn').onclick=()=>$('#sidebar').classList.toggle('open');$('#darkBtn').onclick=()=>{document.body.classList.toggle('dark');localStorage.setItem('kb_dark',document.body.classList.contains('dark'))};
$('#logoutBtn').onclick=()=>{sessionStorage.removeItem('kb_login');$('#app').classList.add('hidden');$('#loginScreen').classList.remove('hidden')};
$('#loginForm').onsubmit=e=>{e.preventDefault();if($('#loginUser').value==='admin'&&$('#loginPass').value==='admin123'){sessionStorage.setItem('kb_login','1');$('#loginScreen').classList.add('hidden');$('#app').classList.remove('hidden');toast('Login berhasil')}else alert('Username/password salah.')};
if(sessionStorage.getItem('kb_login')==='1'){$('#loginScreen').classList.add('hidden');$('#app').classList.remove('hidden')}
if(localStorage.getItem('kb_dark')==='true')document.body.classList.add('dark');
const today=new Date();$('#today').textContent=today.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});$('#stDate').value=today.toISOString().slice(0,10);$('#inMonth').value=today.toISOString().slice(0,7);$('#outMonth').value=today.toISOString().slice(0,7);refresh();
