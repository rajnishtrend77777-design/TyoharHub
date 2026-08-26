require("dotenv").config();
const express=require("express"),path=require("path"),fs=require("fs"),crypto=require("crypto"),bcrypt=require("bcryptjs"),jwt=require("jsonwebtoken"),cookieParser=require("cookie-parser"),multer=require("multer"),Razorpay=require("razorpay");
const app=express();
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
const PORT=Number(process.env.PORT||3000);
const JWT_SECRET=process.env.JWT_SECRET||"CHANGE_THIS_SECRET_IN_ENV";
const ADMIN_PATH=(process.env.ADMIN_PATH||"/tyoharhub-control-7x9k2").replace(/^\//,"");
const dataFile=path.join(__dirname,"tyoharhub-data.json");
const uploadDir=path.join(__dirname,"public","uploads"); fs.mkdirSync(uploadDir,{recursive:true});
const upload=multer({dest:uploadDir});
app.use(express.json({limit:"2mb"})); app.use(express.urlencoded({extended:true})); app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
const seed=[
{id:1,title:"Happy Diwali Festival",festival:"Diwali",price:29,image:"/assets/poster-diwali.svg",description:"Premium diya and rangoli design"},
{id:2,title:"Raksha Bandhan Premium",festival:"Raksha Bandhan",price:19,image:"/assets/poster-raksha.svg",description:"Brother-sister festive design"},
{id:3,title:"Happy Ganesh Chaturthi",festival:"Ganesh Chaturthi",price:29,image:"/assets/poster-ganesh.svg",description:"Traditional Ganesh festival design"},
{id:4,title:"Happy Holi Festival",festival:"Holi",price:19,image:"/assets/poster-holi.svg",description:"Colorful Holi design"},
{id:5,title:"Shubh Navratri",festival:"Navratri",price:29,image:"/assets/poster-navratri.svg",description:"Elegant Navratri design"},
{id:6,title:"Eid Mubarak",festival:"Eid",price:19,image:"/assets/poster-eid.svg",description:"Festive Eid design"},
{id:7,title:"Happy Janmashtami",festival:"Janmashtami",price:0,image:"/assets/poster-janmashtami.svg",description:"Free Krishna poster"},
{id:8,title:"Happy Independence Day",festival:"Independence Day",price:0,image:"/assets/poster-independence.svg",description:"Free national festival poster"}
];
function load(){if(!fs.existsSync(dataFile)){const d={admins:[],posters:seed,orders:[]};fs.writeFileSync(dataFile,JSON.stringify(d,null,2));return d}try{return JSON.parse(fs.readFileSync(dataFile,"utf8"))}catch{return {admins:[],posters:seed,orders:[]}}}
const data=load(); function save(){fs.writeFileSync(dataFile,JSON.stringify(data,null,2))} function nextId(a){return a.length?Math.max(...a.map(x=>Number(x.id)||0))+1:1}
const adminEmail=process.env.ADMIN_EMAIL||"admin@tyoharhub.in",adminPassword=process.env.ADMIN_PASSWORD||"ChangeMe123!";
if(!data.admins.some(a=>a.email===adminEmail)){data.admins.push({id:nextId(data.admins),email:adminEmail,password_hash:bcrypt.hashSync(adminPassword,12)});save()}
function auth(req,res,next){try{const t=req.cookies.tyoharhub_admin;if(!t)throw 0;req.admin=jwt.verify(t,JWT_SECRET);next()}catch{res.status(401).json({error:"Unauthorized"})}}
app.get("/api/posters",(req,res)=>{let list=data.posters.slice();const {festival,type,q}=req.query;if(festival&&festival!=="All")list=list.filter(p=>p.festival===festival);if(type==="free")list=list.filter(p=>p.price===0);if(type==="premium")list=list.filter(p=>p.price>0);if(q)list=list.filter(p=>(p.title+" "+p.festival).toLowerCase().includes(String(q).toLowerCase()));list.sort((a,b)=>b.id-a.id);res.json(list)});
app.post("/api/admin/login",(req,res)=>{const {email,password}=req.body;const a=data.admins.find(x=>x.email===email);if(!a||!bcrypt.compareSync(password||"",a.password_hash))return res.status(401).json({error:"Invalid credentials"});const token=jwt.sign({id:a.id,email:a.email},JWT_SECRET,{expiresIn:"8h"});res.cookie("tyoharhub_admin",token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:28800000});res.json({ok:true})});
app.post("/api/admin/logout",(req,res)=>{res.clearCookie("tyoharhub_admin");res.json({ok:true})});
app.get("/api/admin/me",auth,(req,res)=>res.json({email:req.admin.email}));
app.get("/api/admin/orders",auth,(req,res)=>res.json(data.orders.slice().reverse()));
app.post("/api/admin/posters",auth,upload.single("image"),(req,res)=>{const {title,festival,price,description}=req.body;if(!title||!festival)return res.status(400).json({error:"Title and festival are required"});const image=req.file?`/uploads/${req.file.filename}`:(req.body.image||"/assets/poster-diwali.svg");const p={id:nextId(data.posters),title,festival,price:Number(price||0),image,description:description||"",created_at:new Date().toISOString()};data.posters.push(p);save();res.json({id:p.id})});
app.patch("/api/admin/posters/:id",auth,(req,res)=>{const p=data.posters.find(x=>String(x.id)===String(req.params.id));if(!p)return res.status(404).json({error:"Not found"});if(req.body.title!==undefined)p.title=req.body.title;if(req.body.festival!==undefined)p.festival=req.body.festival;if(req.body.price!==undefined)p.price=Number(req.body.price);if(req.body.description!==undefined)p.description=req.body.description;save();res.json({ok:true})});
app.delete("/api/admin/posters/:id",auth,(req,res)=>{data.posters=data.posters.filter(p=>String(p.id)!==String(req.params.id));save();res.json({ok:true})});
app.post("/api/orders/create",async(req,res)=>{const p=data.posters.find(x=>String(x.id)===String(req.body.posterId));if(!p)return res.status(404).json({error:"Poster not found"});if(p.price<=0)return res.json({free:true,image:p.image});if(!process.env.RAZORPAY_KEY_ID||!process.env.RAZORPAY_KEY_SECRET)return res.status(503).json({error:"Payment gateway is not configured"});try{const rz=new Razorpay({key_id:process.env.RAZORPAY_KEY_ID,key_secret:process.env.RAZORPAY_KEY_SECRET});const order=await rz.orders.create({amount:p.price*100,currency:"INR",receipt:`tyohar_${Date.now()}`});data.orders.push({id:nextId(data.orders),poster_id:p.id,amount:p.price,status:"created",razorpay_order_id:order.id,customer_email:req.body.email||"",created_at:new Date().toISOString()});save();res.json({key:process.env.RAZORPAY_KEY_ID,order,poster:p})}catch(e){res.status(500).json({error:"Could not create payment order"})}});
app.post("/api/orders/verify",(req,res)=>{if(!process.env.RAZORPAY_KEY_SECRET)return res.status(503).json({error:"Payment gateway is not configured"});const {razorpay_order_id,razorpay_payment_id,razorpay_signature,posterId}=req.body;const expected=crypto.createHmac("sha256",process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");if(expected!==razorpay_signature)return res.status(400).json({error:"Invalid payment signature"});const o=data.orders.find(x=>x.razorpay_order_id===razorpay_order_id);if(o){o.status="paid";o.razorpay_payment_id=razorpay_payment_id;save()}const p=data.posters.find(x=>String(x.id)===String(posterId));res.json({ok:true,image:p?.image})});
// Public files. The admin HTML is deliberately NOT inside this static path.
app.use(express.static(path.join(__dirname,"public"),{index:"index.html"}));
app.get(`/${ADMIN_PATH}`,(req,res)=>res.sendFile(path.join(__dirname,"admin","admin.html")));
app.get("/admin.js",(req,res)=>res.sendFile(path.join(__dirname,"admin","admin.js")));
const seoFestivals = [
  ["diwali","Diwali","Diwali Posters 2026","Diwali posters 2026, Diwali wishes posters, Diwali festival designs"],
  ["holi","Holi","Holi Posters 2026","Holi posters 2026, Holi wishes posters, Holi festival designs"],
  ["raksha-bandhan","Raksha Bandhan","Raksha Bandhan Posters 2026","Raksha Bandhan posters, Rakhi posters, Raksha Bandhan wishes"],
  ["ganesh-chaturthi","Ganesh Chaturthi","Ganesh Chaturthi Posters 2026","Ganesh Chaturthi posters, Ganesh festival posters, Ganesh wishes"],
  ["navratri","Navratri","Navratri Posters 2026","Navratri posters, Navratri wishes, Garba festival posters"],
  ["dussehra","Dussehra","Dussehra Posters 2026","Dussehra posters, Vijayadashami posters, Dussehra wishes"],
  ["janmashtami","Janmashtami","Janmashtami Posters 2026","Janmashtami posters, Krishna posters, Janmashtami wishes"],
  ["maha-shivratri","Maha Shivratri","Maha Shivratri Posters 2026","Maha Shivratri posters, Shiva posters, Mahashivratri wishes"],
  ["ram-navami","Ram Navami","Ram Navami Posters 2026","Ram Navami posters, Lord Ram posters, Ram Navami wishes"],
  ["hanuman-jayanti","Hanuman Jayanti","Hanuman Jayanti Posters 2026","Hanuman Jayanti posters, Hanuman posters, Bajrangbali wishes"],
  ["basant-panchami","Basant Panchami","Basant Panchami Posters 2026","Basant Panchami posters, Saraswati Puja posters, Basant Panchami wishes"],
  ["makar-sankranti","Makar Sankranti","Makar Sankranti Posters 2026","Makar Sankranti posters, kite festival posters, Sankranti wishes"],
  ["pongal","Pongal","Pongal Posters 2026","Pongal posters, Pongal festival designs, Pongal wishes"],
  ["onam","Onam","Onam Posters 2026","Onam posters, Onam wishes, Kerala festival designs"],
  ["ugadi","Ugadi","Ugadi Posters 2026","Ugadi posters, Ugadi wishes, Telugu New Year posters"],
  ["gudi-padwa","Gudi Padwa","Gudi Padwa Posters 2026","Gudi Padwa posters, Marathi New Year posters, Gudi Padwa wishes"],
  ["baisakhi","Baisakhi","Baisakhi Posters 2026","Baisakhi posters, Vaisakhi wishes, Baisakhi festival designs"],
  ["vishu","Vishu","Vishu Posters 2026","Vishu posters, Vishu wishes, Kerala New Year posters"],
  ["pohela-boishakh","Pohela Boishakh","Pohela Boishakh Posters 2026","Pohela Boishakh posters, Bengali New Year wishes"],
  ["karwa-chauth","Karwa Chauth","Karwa Chauth Posters 2026","Karwa Chauth posters, Karwa Chauth wishes, Karwa Chauth designs"],
  ["teej","Teej","Teej Posters 2026","Teej posters, Hariyali Teej wishes, Teej festival designs"],
  ["chhath-puja","Chhath Puja","Chhath Puja Posters 2026","Chhath Puja posters, Chhath wishes, Chhath festival designs"],
  ["dhanteras","Dhanteras","Dhanteras Posters 2026","Dhanteras posters, Dhanteras wishes, Dhanteras festival designs"],
  ["bhai-dooj","Bhai Dooj","Bhai Dooj Posters 2026","Bhai Dooj posters, Bhai Dooj wishes, brother sister posters"],
  ["govardhan-puja","Govardhan Puja","Govardhan Puja Posters 2026","Govardhan Puja posters, Govardhan wishes, Krishna festival posters"],
  ["durga-puja","Durga Puja","Durga Puja Posters 2026","Durga Puja posters, Durga Maa posters, Durga Puja wishes"],
  ["maha-navami","Maha Navami","Maha Navami Posters 2026","Maha Navami posters, Navratri wishes, Durga Puja posters"],
  ["saraswati-puja","Saraswati Puja","Saraswati Puja Posters 2026","Saraswati Puja posters, Maa Saraswati posters, Saraswati wishes"],
  ["vishwakarma-puja","Vishwakarma Puja","Vishwakarma Puja Posters 2026","Vishwakarma Puja posters, Vishwakarma wishes, Puja designs"],
  ["narasimha-jayanti","Narasimha Jayanti","Narasimha Jayanti Posters 2026","Narasimha Jayanti posters, Lord Narasimha wishes"],
  ["parshuram-jayanti","Parshuram Jayanti","Parshuram Jayanti Posters 2026","Parshuram Jayanti posters, Parshuram wishes"],
  ["akshaya-tritiya","Akshaya Tritiya","Akshaya Tritiya Posters 2026","Akshaya Tritiya posters, Akshaya Tritiya wishes, festival designs"],
  ["sawan","Sawan","Sawan Posters 2026","Sawan posters, Sawan Somwar wishes, Shiva festival designs"],
  ["nag-panchami","Nag Panchami","Nag Panchami Posters 2026","Nag Panchami posters, Nag Panchami wishes, festival designs"],
  ["guru-purnima","Guru Purnima","Guru Purnima Posters 2026","Guru Purnima posters, Guru Purnima wishes, teacher appreciation posters"],
  ["buddha-purnima","Buddha Purnima","Buddha Purnima Posters 2026","Buddha Purnima posters, Buddha Jayanti wishes, Buddhist festival posters"],
  ["mahavir-jayanti","Mahavir Jayanti","Mahavir Jayanti Posters 2026","Mahavir Jayanti posters, Mahavir Swami wishes, Jain festival designs"],
  ["paryushan","Paryushan","Paryushan Posters 2026","Paryushan posters, Paryushan wishes, Jain festival designs"],
  ["guru-nanak-jayanti","Guru Nanak Jayanti","Guru Nanak Jayanti Posters 2026","Guru Nanak Jayanti posters, Guru Nanak wishes, Gurpurab designs"],
  ["independence-day","Independence Day","Independence Day Posters 2026","Independence Day posters, 15 August posters, Indian Independence wishes"],
  ["republic-day","Republic Day","Republic Day Posters 2026","Republic Day posters, 26 January posters, Republic Day wishes"],
  ["gandhi-jayanti","Gandhi Jayanti","Gandhi Jayanti Posters 2026","Gandhi Jayanti posters, Gandhi wishes, 2 October posters"],
  ["national-youth-day","National Youth Day","National Youth Day Posters 2026","National Youth Day posters, Swami Vivekananda wishes"],
  ["teachers-day","Teachers Day","Teachers Day Posters 2026","Teachers Day posters, teacher appreciation posters, Teachers Day wishes"],
  ["childrens-day","Childrens Day","Childrens Day Posters 2026","Childrens Day posters, Children's Day wishes, school posters"],
  ["womens-day","International Womens Day","Womens Day Posters 2026","Womens Day posters, International Women's Day wishes"],
  ["mothers-day","Mothers Day","Mothers Day Posters 2026","Mothers Day posters, Mother's Day wishes, mom appreciation posters"],
  ["fathers-day","Fathers Day","Fathers Day Posters 2026","Fathers Day posters, Father's Day wishes, dad appreciation posters"],
  ["christmas","Christmas","Christmas Posters 2026","Christmas posters, Christmas wishes, Christmas festival designs"],
  ["new-year","New Year","New Year Posters 2026","New Year posters, Happy New Year wishes, New Year designs"],
  ["eid-ul-fitr","Eid ul Fitr","Eid ul Fitr Posters 2026","Eid ul Fitr posters, Eid Mubarak wishes, Eid designs"],
  ["eid-ul-adha","Eid ul Adha","Eid ul Adha Posters 2026","Eid ul Adha posters, Bakrid wishes, Eid festival designs"],
  ["ramadan","Ramadan","Ramadan Posters 2026","Ramadan posters, Ramadan Kareem wishes, Ramadan designs"],
  ["milad-un-nabi","Milad Un Nabi","Milad Un Nabi Posters 2026","Milad Un Nabi posters, Eid Milad wishes, Islamic festival designs"],
  ["good-friday","Good Friday","Good Friday Posters 2026","Good Friday posters, Good Friday wishes, Christian festival designs"],
  ["easter","Easter","Easter Posters 2026","Easter posters, Easter wishes, Easter festival designs"],
  ["bihu","Bihu","Bihu Posters 2026","Bihu posters, Bihu wishes, Assam festival designs"],
  ["losar","Losar","Losar Posters 2026","Losar posters, Tibetan New Year wishes, Losar festival designs"],
  ["hariyali-teej","Hariyali Teej","Hariyali Teej Posters 2026","Hariyali Teej posters, Teej wishes, Hariyali Teej designs"],
  ["janai-purnima","Janai Purnima","Janai Purnima Posters 2026","Janai Purnima posters, Janai Purnima wishes, festival designs"]
];
seoFestivals.forEach(([slug, name, title, keywords]) => {
  app.get(`/${slug}-posters`, (req, res) => {

    const festivalPosters = data.posters.filter(
      p => String(p.festival || "").toLowerCase() === name.toLowerCase()
    );

    const cards = festivalPosters.map(p => `
      <article class="poster-card">
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}">
        <h2>${escapeHtml(p.title)}</h2>
        <p>${escapeHtml(p.description || "")}</p>
      </article>
    `).join("");

    res.send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | TyoharHub</title>
<meta name="description" content="Explore beautiful ${name} festival posters 2026 on TyoharHub. Discover free and premium ${name} posters, wishes and festival designs.">
<meta name="keywords" content="${keywords}, TyoharHub">
<link rel="canonical" href="https://tyoharhub.onrender.com/${slug}-posters">
</head>
<body>
<main>
<h1>${title}</h1>
<p>Explore beautiful ${name} festival posters on TyoharHub. Discover free and premium ${name} designs, wishes posters and festival graphics.</p>

<h2>${name} Festival Posters</h2>

<p>${keywords}.</p>

<section>
${cards || `<p>New ${name} posters are coming soon. Check back soon on TyoharHub.</p>`}
</section>

<p><a href="/">← Back to TyoharHub</a></p>
</main>
</body>
</html>`);
  });
});
  const posterCards = (data.posters || []).map(p => `
    <article class="poster-card">
      <img
        src="${escapeHtml(p.image)}"
        alt="${escapeHtml(p.title)}"
        loading="lazy"
      >

      <div class="poster-info">
        <h2>${escapeHtml(p.title)}</h2>
        <p>${escapeHtml(p.description || "Beautiful Diwali festival poster")}</p>

        ${
          Number(p.price) === 0
          ? `<span class="price free">FREE</span>`
          : `<span class="price">₹${Number(p.price)}</span>`
        }
      </div>
    </article>
  `).join("");

app.get("/sitemap.xml", (req, res) => {
  const baseUrl = "https://tyoharhub.onrender.com";

  const urls = [
    "/",
    ...seoFestivals.map(([slug]) => `/${slug}-posters`)
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `
  <url>
    <loc>${baseUrl}${url}</loc>
  </url>`).join("")}
</urlset>`;

  res.status(200).set("Content-Type", "application/xml; charset=utf-8").send(xml);
});
});
