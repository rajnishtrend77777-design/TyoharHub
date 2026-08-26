const festivals = [
  ["Diwali","🪔"],["Holi","🎨"],["Mahashivratri","🔱"],["Ganesh Chaturthi","🐘"],
  ["Navratri","🌺"],["Raksha Bandhan","🎀"],["Janmashtami","🦚"],["Eid","🌙"],
  ["Christmas","🎄"],["Independence Day","🇮🇳"],["Republic Day","🇮🇳"],["Makar Sankranti","🪁"]
];
const fallbackPosters = [
  {id:1,title:"Happy Diwali Festival",festival:"Diwali",price:29,image:"/assets/poster-diwali.svg"},
  {id:2,title:"Raksha Bandhan Premium",festival:"Raksha Bandhan",price:19,image:"/assets/poster-raksha.svg"},
  {id:3,title:"Happy Ganesh Chaturthi",festival:"Ganesh Chaturthi",price:29,image:"/assets/poster-ganesh.svg"},
  {id:4,title:"Happy Holi Festival",festival:"Holi",price:19,image:"/assets/poster-holi.svg"},
  {id:5,title:"Shubh Navratri",festival:"Navratri",price:29,image:"/assets/poster-navratri.svg"},
  {id:6,title:"Eid Mubarak",festival:"Eid",price:19,image:"/assets/poster-eid.svg"},
  {id:7,title:"Happy Janmashtami",festival:"Janmashtami",price:0,image:"/assets/poster-janmashtami.svg"},
  {id:8,title:"Happy Independence Day",festival:"Independence Day",price:0,image:"/assets/poster-independence.svg"}
];

let posters = fallbackPosters.slice();

async function loadPosters(params=""){
  try { const r=await fetch("/api/posters"+params); if(r.ok) posters=await r.json(); } catch(e){}
  return posters;
}
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const money=n=>n===0?"FREE":`₹${n}`;

function nav(active="home"){
return `<header class="nav"><div class="container navin">
<a class="brand" href="#/"><span class="logo">🪔</span><span>Tyohar<span class="hub">Hub</span><small>Har Tyohar, Ek Nayi Pehchaan.</small></span></a>
<nav class="links">
<a class="${active==="home"?"active":""}" href="#/">Home</a><a href="#/festivals">All Festivals</a><a href="#/free">Free Posters</a><a class="${active==="premium"?"active":""}" href="#/premium">Premium</a><a class="${active==="custom"?"active":""}" href="#/custom">Custom Poster</a><a href="#/calendar">Festival Calendar</a><a href="#/blog">Blog</a><a href="#/contact">Contact</a>
</nav><input id="globalSearch" class="search" placeholder="Search festivals, posters..." onkeydown="if(event.key==='Enter')goSearch(this.value)"><button class="menu" onclick="toggleMenu()">☰</button>
</div></header>`;
}
function toggleMenu(){document.querySelector(".links")?.classList.toggle("mobileOpen");}
function goSearch(q){location.hash="#/search?q="+encodeURIComponent(q)}

function footer(){return `<footer><div class="container footerGrid"><div><div class="brand"><span class="logo">🪔</span><span>Tyohar<span class="hub">Hub</span><small>Har Tyohar, Ek Nayi Pehchaan.</small></span></div><p>India's destination for beautiful free, premium and custom festival posters.</p></div><div><h4>Explore</h4><a href="#/festivals">All Festivals</a><a href="#/free">Free Posters</a><a href="#/premium">Premium Shop</a><a href="#/custom">Custom Poster</a></div><div><h4>Company</h4><a href="#/about">About Us</a><a href="#/contact">Contact</a><a href="#/terms">Terms</a><a href="#/privacy">Privacy</a></div><div><h4>Support</h4><a href="#/contact">Help Center</a><a href="#/contact">FAQ</a><a href="#/contact">Refund Policy</a></div></div><div class="container copy">© 2026 TyoharHub. Made with ❤️ in India.</div></footer>`}

function festivalTiles(){return `<div class="festivalRow">${festivals.map(([n,i])=>`<a class="festival" href="#/festival/${encodeURIComponent(n)}"><div class="icon">${i}</div><span>${n}</span></a>`).join("")}</div>`}
function cards(list=posters){return `<div class="grid">${list.map(p=>`<article class="card"><img src="${esc(p.image)}" alt="${esc(p.title)}"><div class="cardBody"><span class="badge ${p.price>0?"p":""}">${p.price>0?"PREMIUM":"FREE"}</span><h3>${esc(p.title)}</h3><div class="price">${money(p.price)} ${p.price>0?`<s>₹${p.price*2}</s>`:""}</div><div class="cardActions"><button class="smallbtn" onclick="downloadPoster(${p.id})">${p.price===0?"Download":"Preview"}</button>${p.price>0?`<button class="smallbtn buy" onclick="buyPoster(${p.id})">Buy Now</button>`:""}</div></div></article>`).join("")}</div>`}

async function home(){
await loadPosters();
return nav("home")+`<main>
<section class="hero"><div class="container heroGrid"><div><div class="eyebrow">Indian Festival Poster Hub</div><h1>Har Tyohar,<br><span>Ek Nayi Pehchaan.</span></h1><p>Beautiful Indian festival posters — free, premium and customizable. Download instantly and share your celebrations everywhere.</p><div class="actions"><a class="btn primary" href="#/free">⬇ Explore Free Posters</a><a class="btn premium" href="#/premium">👑 Premium Collection</a><a class="btn outline" href="#/custom">✎ Create Custom Poster</a></div></div><div class="posterStack"><img src="/assets/poster-diwali.svg"><img src="/assets/poster-raksha.svg"><img src="/assets/poster-ganesh.svg"></div></div></section>
<section class="section"><div class="container"><div class="sectionHead"><div><h2>Popular Festivals</h2><div class="muted">Find posters for every celebration</div></div><a class="btn outline" href="#/festivals">View All →</a></div>${festivalTiles()}</div></section>
<section class="section"><div class="container"><div class="sectionHead"><div><h2>🔥 Trending Posters</h2></div><a href="#/premium" class="muted">View All →</a></div>${cards(posters.slice(0,8))}</div></section>
<section class="section"><div class="container"><div class="banner"><div><h3>Create Your Custom Poster</h3><p>Add your name, logo, contact and get your own festival design.</p></div><a class="btn primary" href="#/custom">Create Now →</a></div></div></section>
<section class="section"><div class="container"><h2>Why TyoharHub?</h2><div class="features"><div class="feature">🎉<b>Huge Collection</b><p>Indian festival posters in one place.</p></div><div class="feature">✨<b>High Quality</b><p>Print-ready HD designs.</p></div><div class="feature">⬇️<b>Easy Download</b><p>One-click downloads for free designs.</p></div><div class="feature">📲<b>Share Anywhere</b><p>Perfect for WhatsApp and Instagram.</p></div><div class="feature">✏️<b>Customizable</b><p>Add your name, logo and contact.</p></div></div></div></section>
</main>${footer()}`;
}

async function listing(type="all", festival=null){
await loadPosters();
let list=posters;
if(type==="free") list=list.filter(p=>p.price===0);
if(type==="premium") list=list.filter(p=>p.price>0);
if(festival) list=list.filter(p=>p.festival.toLowerCase()===festival.toLowerCase());
return nav(type==="premium"?"premium":"")+`<main><section class="pageHero"><div class="container"><div class="eyebrow">TyoharHub Collection</div><h1>${festival|| (type==="free"?"Free Posters":type==="premium"?"Premium Shop":"All Festivals")}</h1><p class="muted">${festival?`Beautiful ${festival} posters for your celebration.`:"Discover festival designs made for India."}</p></div></section><section class="section"><div class="container"><div class="filters"><button class="chip active">All</button>${festivals.map(([n])=>`<button class="chip" onclick="location.hash='#/festival/${encodeURIComponent(n)}'">${n}</button>`).join("")}</div>${cards(list)}</div></section></main>${footer()}`;
}

function custom(){
return nav("custom")+`<main><section class="pageHero"><div class="container"><div class="eyebrow">Personalized • HD • Print Ready</div><h1>Create Your Custom Poster</h1><p class="muted">Choose a festival, add your details and preview your design instantly.</p></div></section><section class="section"><div class="container custom">
<div class="panel"><h3>1. Your Details</h3><div class="field"><label>Festival</label><select id="cFestival" onchange="updateCustom()">${festivals.map(([n])=>`<option>${n}</option>`).join("")}</select></div><div class="field"><label>Name / Business Name</label><input id="cName" value="Sharma Sweets" oninput="updateCustom()"></div><div class="field"><label>Tagline / Greeting</label><input id="cTag" value="Mithas hamari, vishwas aapka ❤️" oninput="updateCustom()"></div><div class="field"><label>Phone Number</label><input id="cPhone" value="9876543210" oninput="updateCustom()"></div><div class="field"><label>Address</label><input id="cAddress" value="Varanasi, Uttar Pradesh" oninput="updateCustom()"></div><div class="field"><label>Website / Social</label><input id="cWeb" placeholder="instagram.com/yourbrand"></div><div class="field"><label>Primary Color</label><input id="cColor" type="color" value="#7a1f45" oninput="updateCustom()"></div></div>
<div class="creatorPreview"><canvas id="posterCanvas" class="previewPoster" width="600" height="800"></canvas></div>
<div class="panel"><h3>Order Summary</h3><p class="muted">Custom HD Poster</p><div style="font-size:28px;color:var(--gold);font-weight:800">₹99</div><p class="muted">Includes personalized text, HD export and print-ready file.</p><button class="btn premium" style="width:100%" onclick="downloadCustom()">Preview & Download</button><hr style="border-color:var(--line);margin:20px 0"><div class="feature">🔒 <b>Secure Checkout</b><p>Your payment is processed securely.</p></div><div class="feature">⬇️ <b>Instant Download</b><p>Get your poster after successful payment.</p></div></div>
</div></section><section class="section"><div class="container"><h2>How It Works</h2><div class="steps"><div class="step"><div class="num">1</div><b>Choose Festival</b><p class="muted">Select your celebration.</p></div><div class="step"><div class="num">2</div><b>Add Details</b><p class="muted">Name, phone, greeting and more.</p></div><div class="step"><div class="num">3</div><b>Preview</b><p class="muted">See your design instantly.</p></div><div class="step"><div class="num">4</div><b>Pay & Download</b><p class="muted">Download your HD poster.</p></div></div></div></section></main>${footer()}`;
}

function updateCustom(){
const c=document.getElementById("posterCanvas"); if(!c)return;
const x=c.getContext("2d"), w=c.width,h=c.height;
const festival=document.getElementById("cFestival").value,name=document.getElementById("cName").value,tag=document.getElementById("cTag").value,phone=document.getElementById("cPhone").value,address=document.getElementById("cAddress").value,color=document.getElementById("cColor").value;
const icons={Diwali:"🪔",Holi:"🎨",Mahashivratri:"🔱","Ganesh Chaturthi":"🐘",Navratri:"🌺","Raksha Bandhan":"🎀",Janmashtami:"🦚",Eid:"🌙",Christmas:"🎄","Independence Day":"🇮🇳","Republic Day":"🇮🇳","Makar Sankranti":"🪁"};
const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,"#fff3d9");g.addColorStop(1,color);x.fillStyle=g;x.fillRect(0,0,w,h);
x.strokeStyle="#d69b38";x.lineWidth=12;x.strokeRect(20,20,w-40,h-40);
x.textAlign="center";x.fillStyle="#4a1525";x.font="24px Georgia";x.fillText("Happy",w/2,100);
x.font="bold 58px Georgia";x.fillText(festival,w/2,175);
x.font="150px Arial";x.fillText(icons[festival]||"✨",w/2,390);
x.fillStyle="#fff";x.fillRect(45,470,w-90,190);x.fillStyle="#541329";x.font="bold 38px Arial";x.fillText(name||"Your Name",w/2,535);x.font="22px Arial";x.fillText(tag||"Your festive greeting",w/2,580);x.font="18px Arial";x.fillText(`☎ ${phone||"Phone"}  •  ${address||"Address"}`,w/2,625);
x.fillStyle="#7b4c10";x.font="18px Arial";x.fillText("TyoharHub • Personalized Festival Poster",w/2,740);
}
function downloadCustom(){
const c=document.getElementById("posterCanvas");c.toBlob(blob=>{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="tyoharhub-custom-poster.png";a.click();toast("Custom preview downloaded. Connect payment before charging customers.");});
}

async function downloadPoster(id){
const p=posters.find(x=>x.id==id); if(!p)return;
if(p.price===0){const a=document.createElement("a");a.href=p.image;a.download=(p.title||"poster")+".svg";a.click();toast("Free poster download started.");}
else buyPoster(id);
}
async function buyPoster(id){
const p=posters.find(x=>x.id==id); if(!p)return;
try{
const r=await fetch("/api/orders/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({posterId:p.id,email:""})});
const d=await r.json(); if(!r.ok) throw new Error(d.error||"Payment unavailable");
if(d.free){downloadPoster(id);return;}
if(!window.Razorpay){toast("Razorpay checkout script not loaded.");return;}
const rz=new Razorpay({key:d.key,amount:d.order.amount,currency:"INR",name:"TyoharHub",description:p.title,order_id:d.order.id,handler:async resp=>{
const vr=await fetch("/api/orders/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...resp,posterId:p.id})});const out=await vr.json();if(out.ok){const a=document.createElement("a");a.href=out.image;a.download=p.title+".svg";a.click();toast("Payment verified. Download started.");}else toast(out.error||"Verification failed.");
}});
rz.open();
}catch(e){toast(e.message)}
}
function toast(msg){const d=document.createElement("div");d.className="toast";d.textContent=msg;document.body.appendChild(d);setTimeout(()=>d.remove(),3500)}

async function searchPage(q){await loadPosters();return nav()+`<main><section class="pageHero"><div class="container"><div class="eyebrow">Search</div><h1>Results for “${esc(q)}”</h1></div></section><section class="section"><div class="container">${cards(posters.filter(p=>(p.title+" "+p.festival).toLowerCase().includes(q.toLowerCase())))}</div></section></main>${footer()}`}
function simplePage(title,text){return nav()+`<main><section class="pageHero"><div class="container"><h1>${title}</h1><p class="muted">${text}</p></div></section><section class="section"><div class="container panel"><h2>TyoharHub</h2><p class="muted">We are building a trusted destination for beautiful Indian festival posters. For support, use the Contact page.</p></div></section></main>${footer()}`}
async function router(){
const hash=location.hash||"#/";
let html;
if(hash==="#/"||hash==="#") html=await home();
else if(hash==="#/free") html=await listing("free");
else if(hash==="#/premium") html=await listing("premium");
else if(hash==="#/festivals") html=await listing("all");
else if(hash.startsWith("#/festival/")) html=await listing("all",decodeURIComponent(hash.split("/")[2]));
else if(hash==="#/custom") html=custom();
else if(hash.startsWith("#/search")) html=await searchPage(new URLSearchParams(hash.split("?")[1]||"").get("q")||"");
else if(hash==="#/calendar") html=simplePage("Festival Calendar","Upcoming Indian festivals and poster drops.");
else if(hash==="#/blog") html=simplePage("TyoharHub Blog","Festival ideas, poster tips and creative inspiration.");
else if(hash==="#/contact") html=simplePage("Contact Us","Email: support@tyoharhub.in • WhatsApp support coming soon.");
else if(hash==="#/about") html=simplePage("About TyoharHub","Free, premium and personalized festival posters for every celebration.");
else html=simplePage("Page Not Found","The page you requested does not exist.");
document.getElementById("app").innerHTML=html;
if(hash==="#/custom") updateCustom();
window.scrollTo(0,0);
}
window.addEventListener("hashchange",router); router();
