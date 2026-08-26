require("dotenv").config();
const express=require("express"),path=require("path"),fs=require("fs"),crypto=require("crypto"),bcrypt=require("bcryptjs"),jwt=require("jsonwebtoken"),cookieParser=require("cookie-parser"),multer=require("multer"),Razorpay=require("razorpay");
const app=express();
const PORT=Number(process.env.PORT||3000);
const JWT_SECRET=process.env.JWT_SECRET||"CHANGE_THIS_SECRET_IN_ENV";
const ADMIN_PATH=(process.env.ADMIN_PATH||"/tyoharhub-control-7x9k2").replace(/^\//,"");
const dataFile=path.join(__dirname,"tyoharhub-data.json");
const uploadDir=path.join(__dirname,"public","uploads"); fs.mkdirSync(uploadDir,{recursive:true});
const upload=multer({dest:uploadDir});
app.use(express.json({limit:"2mb"})); app.use(express.urlencoded({extended:true})); app.use(cookieParser());
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
app.get("*",(req,res)=>{if(req.path.startsWith("/api/"))return res.status(404).end();res.sendFile(path.join(__dirname,"public","index.html"))});
app.listen(PORT,()=>console.log(`TyoharHub running at http://localhost:${PORT}`));
