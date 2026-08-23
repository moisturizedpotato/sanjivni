
function genQR(data, size) {
  try {
    const qr = qrcode(0, 'M');
    qr.addData(data);
    qr.make();
    // qrcode-generator's createSvgTag returns an <svg> element string
    let svg = qr.createSvgTag(4, 0);
    // Add width and height explicitly
    return svg.replace('<svg ', `<svg width="${size}" height="${size}" `);
  } catch(e) {
    return `<div style="width:${size}px;height:${size}px;background:#eee;color:#000;font-size:10px">QR Error</div>`;
  }
}

function getSignedInPhone() {
  const value = APP.loginPhone || localStorage.getItem('arogya_user_phone') || '';
  const digits = value.replace(/\D/g, '').replace(/^91/, '');
  return digits.length === 10 ? '+91' + digits : '';
}

/* ═══════════════════════════════════════════
   DOCTORS DATA — 35 DOCTORS
═══════════════════════════════════════════ */
const DOCTORS=[
  {id:1,name:"Dr. Priya Sharma",specialty:"Dermatologist",clinic:"SkinCare Clinic",location:"Connaught Place",lat:28.6315,lng:77.2167,rating:4.9,reviews:312,fee:800,exp:12,slots:["10:00 AM","11:30 AM","2:00 PM","4:30 PM"],av:"PS",clr:"#0d3326",ac:"#00c87a",verified:true,next:"Today",punctuality:96,queue:3,mode:["clinic","video"]},
  {id:2,name:"Dr. Arjun Mehta",specialty:"Dentist",clinic:"BrightSmile Dental",location:"Lajpat Nagar",lat:28.5708,lng:77.2373,rating:4.7,reviews:189,fee:600,exp:8,slots:["9:00 AM","12:00 PM","3:00 PM","5:30 PM"],av:"AM",clr:"#0d1f38",ac:"#4d9de0",verified:true,next:"Today",punctuality:88,queue:7,mode:["clinic"]},
  {id:3,name:"Dr. Kavitha Nair",specialty:"Cardiologist",clinic:"HeartCare Center",location:"Dwarka",lat:28.5921,lng:77.0460,rating:4.8,reviews:421,fee:1200,exp:18,slots:["11:00 AM","1:00 PM","3:30 PM"],av:"KN",clr:"#2d0f0f",ac:"#e05c5c",verified:true,next:"Tomorrow",punctuality:92,queue:1,mode:["clinic","video"]},
  {id:4,name:"Dr. Rahul Gupta",specialty:"Orthopedic",clinic:"BoneJoint Clinic",location:"Rohini",lat:28.7041,lng:77.1025,rating:4.6,reviews:267,fee:900,exp:14,slots:["10:30 AM","12:30 PM","4:00 PM"],av:"RG",clr:"#1f1038",ac:"#a78bfa",verified:false,next:"Today",punctuality:79,queue:5,mode:["clinic"]},
  {id:5,name:"Dr. Sunita Rao",specialty:"Pediatrician",clinic:"KidsCare Hospital",location:"Janakpuri",lat:28.6219,lng:77.0878,rating:4.9,reviews:534,fee:700,exp:16,slots:["9:30 AM","11:00 AM","2:30 PM","5:00 PM"],av:"SR",clr:"#2d1a00",ac:"#f0b429",verified:true,next:"Today",punctuality:95,queue:11,mode:["clinic","video"]},
  {id:6,name:"Dr. Vikram Singh",specialty:"Neurologist",clinic:"NeuroMind Clinic",location:"Saket",lat:28.5244,lng:77.2090,rating:4.7,reviews:198,fee:1500,exp:22,slots:["10:00 AM","2:00 PM","4:00 PM"],av:"VS",clr:"#0a2218",ac:"#34d399",verified:true,next:"Tomorrow",punctuality:91,queue:2,mode:["clinic","video"]},
  {id:7,name:"Dr. Sneha Kapoor",specialty:"Dentist",clinic:"PearlDent Clinic",location:"Vasant Kunj",lat:28.5200,lng:77.1580,rating:4.8,reviews:203,fee:650,exp:9,slots:["10:00 AM","1:00 PM","4:00 PM"],av:"SK",clr:"#0d1f38",ac:"#4d9de0",verified:true,next:"Today",punctuality:90,queue:4,mode:["clinic","video"]},
  {id:8,name:"Dr. Anil Verma",specialty:"General Physician",clinic:"Verma Medical",location:"Karol Bagh",lat:28.6514,lng:77.1907,rating:4.7,reviews:445,fee:400,exp:20,slots:["9:00 AM","11:00 AM","2:00 PM","5:00 PM"],av:"AV",clr:"#0a2010",ac:"#00c87a",verified:true,next:"Today",punctuality:93,queue:14,mode:["clinic","video"]},
  {id:9,name:"Dr. Meena Joshi",specialty:"Ophthalmologist",clinic:"ClearVision Eye Care",location:"Nehru Place",lat:28.5494,lng:77.2502,rating:4.9,reviews:312,fee:900,exp:16,slots:["10:00 AM","12:00 PM","3:00 PM"],av:"MJ",clr:"#0a1a38",ac:"#60a5fa",verified:true,next:"Today",punctuality:94,queue:5,mode:["clinic","video"]},
  {id:10,name:"Dr. Anita Singh",specialty:"Gynecologist",clinic:"WomenCare Hospital",location:"Mayur Vihar",lat:28.6080,lng:77.2940,rating:4.8,reviews:567,fee:1000,exp:19,slots:["10:00 AM","1:00 PM","4:00 PM"],av:"AS",clr:"#2d0a2a",ac:"#e879f9",verified:true,next:"Today",punctuality:95,queue:7,mode:["clinic","video"]},
  {id:11,name:"Dr. Pradeep Kumar",specialty:"Urologist",clinic:"KidneyCare Urology",location:"Patel Nagar",lat:28.6549,lng:77.1701,rating:4.7,reviews:234,fee:1100,exp:17,slots:["10:30 AM","2:30 PM","5:00 PM"],av:"PK",clr:"#0d2038",ac:"#38bdf8",verified:true,next:"Today",punctuality:90,queue:2,mode:["clinic","video"]},
  {id:12,name:"Dr. Shalini Tiwari",specialty:"Endocrinologist",clinic:"Diabetes & Thyroid Clinic",location:"Punjabi Bagh",lat:28.6680,lng:77.1310,rating:4.8,reviews:289,fee:1300,exp:21,slots:["11:00 AM","3:00 PM"],av:"ST",clr:"#1a0a2e",ac:"#a78bfa",verified:true,next:"Tomorrow",punctuality:92,queue:1,mode:["clinic","video"]},
  {id:13,name:"Dr. Ritu Sharma",specialty:"Cardiologist",clinic:"Apollo Heart Institute",location:"Sarita Vihar",lat:28.5230,lng:77.2940,rating:4.9,reviews:512,fee:1400,exp:24,slots:["9:00 AM","12:00 PM","3:00 PM"],av:"RS",clr:"#2d0f0f",ac:"#e05c5c",verified:true,next:"Today",punctuality:97,queue:2,mode:["clinic","video"]},
  {id:14,name:"Dr. Vivek Nanda",specialty:"Nephrologist",clinic:"KidneyCare Institute",location:"Patel Nagar",lat:28.6510,lng:77.1720,rating:4.8,reviews:234,fee:1300,exp:20,slots:["11:00 AM","2:00 PM","5:30 PM"],av:"VN",clr:"#0d2038",ac:"#38bdf8",verified:true,next:"Today",punctuality:92,queue:1,mode:["clinic","video"]},
  {id:15,name:"Dr. Ashish Tripathi",specialty:"Psychiatrist",clinic:"MindWell Clinic",location:"Greater Noida",lat:28.4744,lng:77.5040,rating:4.9,reviews:198,fee:1500,exp:18,slots:["10:00 AM","1:00 PM","4:00 PM"],av:"AT",clr:"#0d0a2e",ac:"#818cf8",verified:true,next:"Tomorrow",punctuality:96,queue:0,mode:["clinic","video"]},
  {id:16,name:"Dr. Pooja Malhotra",specialty:"General Physician",clinic:"HealthFirst Clinic",location:"Pitampura",lat:28.7006,lng:77.1370,rating:4.6,reviews:310,fee:350,exp:13,slots:["9:00 AM","11:30 AM","3:00 PM","5:00 PM"],av:"PM",clr:"#0a2010",ac:"#00c87a",verified:true,next:"Today",punctuality:88,queue:6,mode:["clinic","video"]},
  {id:17,name:"Dr. Rajesh Khanna",specialty:"Orthopedic",clinic:"SpineJoint Hospital",location:"Gurgaon Sector 14",lat:28.4595,lng:77.0266,rating:4.8,reviews:341,fee:1100,exp:16,slots:["10:00 AM","12:00 PM","3:30 PM"],av:"RK",clr:"#1f1038",ac:"#a78bfa",verified:true,next:"Today",punctuality:93,queue:3,mode:["clinic","video"]},
  {id:18,name:"Dr. Neha Bhatia",specialty:"Dermatologist",clinic:"DermCure Clinic",location:"Sarojini Nagar",lat:28.5767,lng:77.1930,rating:4.7,reviews:178,fee:750,exp:9,slots:["10:30 AM","1:30 PM","4:30 PM"],av:"NB",clr:"#0d3326",ac:"#00c87a",verified:true,next:"Today",punctuality:87,queue:8,mode:["clinic","video"]},
  {id:19,name:"Dr. Suresh Pandey",specialty:"Pulmonologist",clinic:"BreathEasy Clinic",location:"IP Extension",lat:28.6284,lng:77.3062,rating:4.6,reviews:156,fee:950,exp:14,slots:["10:00 AM","2:00 PM","5:00 PM"],av:"SP",clr:"#0a1f30",ac:"#22d3ee",verified:true,next:"Today",punctuality:89,queue:4,mode:["clinic","video"]},
  {id:20,name:"Dr. Kavya Reddy",specialty:"Gastroenterologist",clinic:"DigestCare Center",location:"South Extension",lat:28.5673,lng:77.2190,rating:4.7,reviews:201,fee:1100,exp:12,slots:["11:00 AM","2:30 PM","5:00 PM"],av:"KR",clr:"#1a1505",ac:"#fb923c",verified:true,next:"Tomorrow",punctuality:90,queue:2,mode:["clinic","video"]},
  {id:21,name:"Dr. Mohit Arora",specialty:"Dentist",clinic:"SmilePlus Dental",location:"Rajouri Garden",lat:28.6480,lng:77.1130,rating:4.5,reviews:145,fee:500,exp:6,slots:["9:30 AM","12:30 PM","4:00 PM"],av:"MA",clr:"#0d1f38",ac:"#4d9de0",verified:true,next:"Today",punctuality:84,queue:9,mode:["clinic"]},
  {id:22,name:"Dr. Divya Kapila",specialty:"Pediatrician",clinic:"Rainbow Kids Clinic",location:"Uttam Nagar",lat:28.6210,lng:77.0598,rating:4.8,reviews:423,fee:600,exp:11,slots:["9:00 AM","11:30 AM","3:30 PM"],av:"DK",clr:"#2d1a00",ac:"#f0b429",verified:true,next:"Today",punctuality:91,queue:7,mode:["clinic","video"]},
  {id:23,name:"Dr. Amit Bose",specialty:"Cardiologist",clinic:"HeartRhythm Center",location:"Noida Sector 18",lat:28.5706,lng:77.3219,rating:4.7,reviews:289,fee:1100,exp:17,slots:["10:00 AM","1:00 PM","4:00 PM"],av:"AB",clr:"#2d0f0f",ac:"#e05c5c",verified:true,next:"Today",punctuality:90,queue:3,mode:["clinic","video"]},
  {id:24,name:"Dr. Sunaina Gupta",specialty:"Gynecologist",clinic:"MaternaCare Hospital",location:"Dwarka Sector 6",lat:28.5975,lng:77.0620,rating:4.9,reviews:612,fee:900,exp:21,slots:["9:30 AM","11:00 AM","2:00 PM"],av:"SG",clr:"#2d0a2a",ac:"#e879f9",verified:true,next:"Today",punctuality:96,queue:4,mode:["clinic","video"]},
  {id:25,name:"Dr. Ramesh Iyer",specialty:"Neurologist",clinic:"BrainCare Institute",location:"Vasant Vihar",lat:28.5590,lng:77.1660,rating:4.6,reviews:167,fee:1400,exp:19,slots:["10:30 AM","2:30 PM"],av:"RI",clr:"#0a2218",ac:"#34d399",verified:true,next:"Tomorrow",punctuality:88,queue:1,mode:["clinic","video"]},
  {id:26,name:"Dr. Preeti Saxena",specialty:"Ophthalmologist",clinic:"EyePlus Vision",location:"Lajpat Nagar",lat:28.5680,lng:77.2430,rating:4.7,reviews:223,fee:800,exp:13,slots:["10:00 AM","1:00 PM","4:30 PM"],av:"PX",clr:"#0a1a38",ac:"#60a5fa",verified:true,next:"Today",punctuality:92,queue:6,mode:["clinic","video"]},
  {id:27,name:"Dr. Karan Bajaj",specialty:"Orthopedic",clinic:"JointCare Clinic",location:"Preet Vihar",lat:28.6412,lng:77.3018,rating:4.5,reviews:134,fee:850,exp:8,slots:["11:00 AM","3:00 PM","5:30 PM"],av:"KB",clr:"#1f1038",ac:"#a78bfa",verified:false,next:"Today",punctuality:82,queue:8,mode:["clinic"]},
  {id:28,name:"Dr. Lata Krishnan",specialty:"Endocrinologist",clinic:"HormoneHealth Clinic",location:"Laxmi Nagar",lat:28.6320,lng:77.2766,rating:4.7,reviews:198,fee:1200,exp:16,slots:["10:00 AM","2:00 PM"],av:"LK",clr:"#1a0a2e",ac:"#a78bfa",verified:true,next:"Tomorrow",punctuality:91,queue:0,mode:["clinic","video"]},
  {id:29,name:"Dr. Farhan Sheikh",specialty:"General Physician",clinic:"AlShifa Clinic",location:"Okhla",lat:28.5344,lng:77.2706,rating:4.8,reviews:387,fee:300,exp:15,slots:["9:00 AM","11:00 AM","2:00 PM","5:00 PM"],av:"FS",clr:"#0a2010",ac:"#00c87a",verified:true,next:"Today",punctuality:94,queue:10,mode:["clinic","video"]},
  {id:30,name:"Dr. Nidhi Agarwal",specialty:"Psychiatrist",clinic:"SereneMinds",location:"GK-2",lat:28.5440,lng:77.2390,rating:4.8,reviews:156,fee:1200,exp:14,slots:["11:00 AM","2:00 PM","5:00 PM"],av:"NA",clr:"#0d0a2e",ac:"#818cf8",verified:true,next:"Today",punctuality:95,queue:1,mode:["clinic","video"]},
  {id:31,name:"Dr. Pawan Dubey",specialty:"Gastroenterologist",clinic:"GutHealth Clinic",location:"Mayur Vihar",lat:28.6100,lng:77.2930,rating:4.6,reviews:143,fee:950,exp:11,slots:["10:30 AM","2:30 PM","5:30 PM"],av:"PD",clr:"#1a1505",ac:"#fb923c",verified:true,next:"Today",punctuality:87,queue:5,mode:["clinic"]},
  {id:32,name:"Dr. Ranjana Tomar",specialty:"Pediatrician",clinic:"LittleStars Clinic",location:"Shalimar Bagh",lat:28.7080,lng:77.1620,rating:4.7,reviews:312,fee:550,exp:10,slots:["9:30 AM","12:00 PM","4:00 PM"],av:"RT",clr:"#2d1a00",ac:"#f0b429",verified:true,next:"Today",punctuality:90,queue:9,mode:["clinic","video"]},
  {id:33,name:"Dr. Tarun Malhotra",specialty:"Urologist",clinic:"UroCare Delhi",location:"Kirti Nagar",lat:28.6545,lng:77.1480,rating:4.6,reviews:178,fee:1000,exp:13,slots:["10:00 AM","1:30 PM","4:30 PM"],av:"TM",clr:"#0d2038",ac:"#38bdf8",verified:true,next:"Today",punctuality:88,queue:3,mode:["clinic","video"]},
  {id:34,name:"Dr. Sujata Rao",specialty:"Dermatologist",clinic:"GlowSkin Center",location:"Noida Sector 62",lat:28.6267,lng:77.3640,rating:4.7,reviews:201,fee:700,exp:10,slots:["10:00 AM","1:00 PM","4:00 PM"],av:"SRo",clr:"#0d3326",ac:"#00c87a",verified:true,next:"Today",punctuality:89,queue:6,mode:["clinic","video"]},
  {id:35,name:"Dr. Deepak Joshi",specialty:"Pulmonologist",clinic:"LungCare Hospital",location:"Rohini Sector 8",lat:28.7140,lng:77.1060,rating:4.6,reviews:134,fee:850,exp:12,slots:["11:30 AM","3:00 PM","5:30 PM"],av:"DJ",clr:"#0a1f30",ac:"#22d3ee",verified:false,next:"Today",punctuality:85,queue:4,mode:["clinic","video"]},
];

/* ═══════════════════════════════════════════
   RECORDS DATA
═══════════════════════════════════════════ */
const RECORDS=[
  {id:1,type:"Prescription",title:"Kidney Stone Treatment",doctor:"Dr. Vivek Nanda",date:"10 Jan 2026",icon:"💊",ac:"#38bdf8",shared:false,sharedUntil:null,
   note:"Continue tamsulosin 0.4mg once daily for 3 weeks. Drink minimum 3L water daily. Avoid high-oxalate foods. Follow-up ultrasound KUB in 4 weeks.",
   medicines:["Tamsulosin 0.4mg","Deflazacort 6mg","Cystone Tablet"]},
  {id:2,type:"Lab Report",title:"Urine Routine & Microscopy",doctor:"Metro Lab",date:"08 Jan 2026",icon:"🧪",ac:"#4d9de0",shared:false,sharedUntil:null,
   note:"Urine calcium 320mg/24hr (slightly elevated). pH 6.0. RBC 8-10/hpf. Reduce oxalate foods. Repeat after 6 weeks.",medicines:[]},
  {id:3,type:"Eye Prescription",title:"Vision Correction — Both Eyes",doctor:"Dr. Meena Joshi",date:"15 Mar 2026",icon:"👁️",ac:"#60a5fa",shared:false,sharedUntil:null,
   note:"Right: Sph -2.25 Cyl -0.50 Axis 180. Left: Sph -2.50 Cyl -0.75 Axis 175. Blue-cut lenses recommended. Next review 12 months.",
   medicines:["Refresh Tears Eye Drops","Systane Ultra"]},
  {id:4,type:"X-Ray Report",title:"Right Knee Fracture",doctor:"Dr. Rahul Gupta",date:"20 Nov 2025",icon:"🩻",ac:"#a78bfa",shared:false,sharedUntil:null,
   note:"Hairline fracture, medial patella. 6-week immobilization. Physiotherapy start week 4. Ibuprofen 400mg TDS after food.",
   medicines:["Ibuprofen 400mg","Calcium + D3 Tablet","Volini Gel"]},
  {id:5,type:"Vaccination",title:"Tetanus Booster (Td)",doctor:"Health Ministry",date:"03 Dec 2024",icon:"💉",ac:"#f0b429",shared:false,sharedUntil:null,
   note:"Td booster administered. Next booster: Dec 2034.",medicines:[]},
  {id:6,type:"Lab Report",title:"Complete Blood Count",doctor:"City Diagnostics",date:"28 Feb 2026",icon:"🧪",ac:"#4d9de0",shared:false,sharedUntil:null,
   note:"Hb 13.8 g/dL. WBC 7200 normal. Serum iron borderline low. Increase iron-rich foods.",
   medicines:["Iron + Folic Acid Tablet"]},
];

/* ═══════════════════════════════════════════
   MEDICINE DATA — Extended with all prescribed
═══════════════════════════════════════════ */
const MEDICINES_DB={
  "tamsulosin 0.4mg":{branded:[{ph:"Apollo Pharmacy",brand:"Urimax 0.4",pack:"10 capsules",price:145,dist:"0.4 km",inStock:true,delivery:false},{ph:"MedPlus",brand:"Urimax 0.4",pack:"10 capsules",price:132,dist:"1.2 km",inStock:true,delivery:false},{ph:"1mg",brand:"Flomax 0.4",pack:"10 capsules",price:118,dist:"Delivery 2hrs",inStock:true,delivery:true},{ph:"NetMeds",brand:"Contiflo OD",pack:"10 capsules",price:110,dist:"Delivery 3hrs",inStock:true,delivery:true}],generic:[{ph:"Jan Aushadhi",brand:"Tamsulosin 0.4",pack:"10 capsules",price:48,dist:"0.9 km",inStock:true,delivery:false},{ph:"Generic Hub",brand:"Tamsulosin 0.4",pack:"10 capsules",price:42,dist:"1.8 km",inStock:true,delivery:false}],savings:"Save ₹103 with generic vs branded", usage:"Take exactly 30 mins after the same meal each day.", doses:"0.4mg to 0.8mg once daily.", purpose:"Relaxes muscles in the prostate and bladder neck to improve urination."},
  "deflazacort 6mg":{branded:[{ph:"Apollo Pharmacy",brand:"Monocort 6",pack:"10 tablets",price:88,dist:"0.4 km",inStock:true,delivery:false},{ph:"MedPlus",brand:"Defcort 6",pack:"10 tablets",price:76,dist:"1.2 km",inStock:true,delivery:false},{ph:"1mg",brand:"Monocort 6",pack:"10 tablets",price:70,dist:"Delivery 2hrs",inStock:true,delivery:true}],generic:[{ph:"Jan Aushadhi",brand:"Deflazacort 6",pack:"10 tablets",price:28,dist:"0.9 km",inStock:true,delivery:false}],savings:"Save ₹60 with generic", usage:"Take with or after food. Do not stop abruptly.", doses:"Typically 6-120mg daily depending on condition.", purpose:"Corticosteroid used for inflammation, allergies and autoimmune disorders."},
  "cystone tablet":{branded:[{ph:"Apollo Pharmacy",brand:"Cystone",pack:"60 tablets",price:165,dist:"0.4 km",inStock:true,delivery:false},{ph:"MedPlus",brand:"Cystone",pack:"60 tablets",price:155,dist:"1.2 km",inStock:true,delivery:false},{ph:"1mg",brand:"Cystone",pack:"60 tablets",price:148,dist:"Delivery 2hrs",inStock:true,delivery:true}],generic:[{ph:"Jan Aushadhi",brand:"Cystone Generic",pack:"60 tablets",price:95,dist:"0.9 km",inStock:false}],savings:"Save ₹70 with generic", usage:"Take with a full glass of water. Maintain high fluid intake.", doses:"Usually 2 tablets twice a day.", purpose:"Prevents and treats kidney stones and urinary tract infections."},
  "refresh tears eye drops":{branded:[{ph:"Apollo Pharmacy",brand:"Refresh Tears",pack:"10 ml",price:180,dist:"0.4 km",inStock:true,delivery:false},{ph:"MedPlus",brand:"Refresh Tears",pack:"10 ml",price:168,dist:"1.2 km",inStock:true,delivery:false},{ph:"1mg",brand:"Refresh Tears",pack:"10 ml",price:155,dist:"Delivery 2hrs",inStock:true,delivery:true}],generic:[{ph:"Jan Aushadhi",brand:"Carboxy Methyl Cellulose",pack:"10 ml",price:45,dist:"0.9 km",inStock:true,delivery:false}],savings:"Save ₹135 with generic", usage:"Instill 1-2 drops in the affected eye(s) as needed.", doses:"Use as required. Discard 1 month after opening.", purpose:"Provides temporary relief from burning and discomfort due to dry eyes."},
  "systane ultra":{branded:[{ph:"Apollo Pharmacy",brand:"Systane Ultra",pack:"10 ml",price:380,dist:"0.4 km",inStock:true,delivery:false},{ph:"MedPlus",brand:"Systane Ultra",pack:"10 ml",price:360,dist:"1.2 km",inStock:true,delivery:false},{ph:"1mg",brand:"Systane Ultra",pack:"10 ml",price:340,dist:"Delivery 2hrs",inStock:true,delivery:true}],generic:[{ph:"Jan Aushadhi",brand:"Lubricant Eye Drops",pack:"10 ml",price:85,dist:"0.9 km",inStock:true,delivery:false}],savings:"Save ₹295 with generic", usage:"Instill 1-2 drops in the affected eye(s) as needed.", doses:"Use as required. Keep tip sterile.", purpose:"High-performance lubricant for extended dry eye relief."},
  "ibuprofen 400mg":{branded:[{ph:"Apollo Pharmacy",brand:"Brufen 400",pack:"10 tablets",price:45,dist:"0.4 km",inStock:true,delivery:false},{ph:"MedPlus",brand:"Combiflam",pack:"10 tablets",price:38,dist:"1.2 km",inStock:true,delivery:false},{ph:"1mg",brand:"Ibugesic",pack:"10 tablets",price:32,dist:"Delivery 2hrs",inStock:true,delivery:true}],generic:[{ph:"Jan Aushadhi",brand:"Ibuprofen 400",pack:"10 tablets",price:12,dist:"0.9 km",inStock:true,delivery:false}],savings:"Save ₹33 with generic", usage:"Take with food or milk to prevent stomach upset.", doses:"1 tablet every 4-6 hours. Max 3200mg/day.", purpose:"Reduces fever, pain, and inflammation."},
  "calcium + d3 tablet":{branded:[{ph:"Apollo Pharmacy",brand:"Shelcal 500",pack:"15 tablets",price:165,dist:"0.4 km",inStock:true,delivery:false},{ph:"MedPlus",brand:"Calcirol",pack:"15 tablets",price:148,dist:"1.2 km",inStock:true,delivery:false},{ph:"1mg",brand:"CalciRich",pack:"15 tablets",price:135,dist:"Delivery 2hrs",inStock:true,delivery:true}],generic:[{ph:"Jan Aushadhi",brand:"Calcium Carbonate + D3",pack:"15 tablets",price:42,dist:"0.9 km",inStock:true,delivery:false}],savings:"Save ₹123 with generic", usage:"Take with a meal for optimal absorption.", doses:"1-2 tablets per day.", purpose:"Prevents/treats calcium deficiency and supports bone health."},
  "volini gel":{branded:[{ph:"Apollo Pharmacy",brand:"Volini Gel",pack:"30g",price:145,dist:"0.4 km",inStock:true,delivery:false},{ph:"MedPlus",brand:"Volini Gel",pack:"30g",price:132,dist:"1.2 km",inStock:true,delivery:false}],generic:[{ph:"Jan Aushadhi",brand:"Diclofenac Gel",pack:"30g",price:48,dist:"0.9 km",inStock:true,delivery:false}],savings:"Save ₹97 with generic", usage:"Apply a thin layer over the affected area 3-4 times daily.", doses:"A small amount per application. Wash hands after use.", purpose:"Topical pain relief for muscle aches, sprains, and joint pain."},
  "iron + folic acid tablet":{branded:[{ph:"Apollo Pharmacy",brand:"Autrin",pack:"30 tablets",price:85,dist:"0.4 km",inStock:true,delivery:false},{ph:"MedPlus",brand:"Feronia-XT",pack:"30 tablets",price:72,dist:"1.2 km",inStock:true,delivery:false},{ph:"1mg",brand:"Fefol",pack:"30 tablets",price:65,dist:"Delivery 2hrs",inStock:true,delivery:true}],generic:[{ph:"Jan Aushadhi",brand:"Iron + Folic Acid",pack:"30 tablets",price:22,dist:"0.9 km",inStock:true,delivery:false}],savings:"Save ₹63 with generic", usage:"Take on an empty stomach or with Vitamin C (e.g. orange juice).", doses:"1 tablet daily as prescribed.", purpose:"Treats iron deficiency anemia and supplements pregnancy."},
  "dolo 650":{branded:[{ph:"Apollo Pharmacy",brand:"Dolo 650",pack:"15 tablets",price:32,dist:"0.4 km",inStock:true,delivery:false},{ph:"MedPlus",brand:"Dolo 650",pack:"15 tablets",price:28,dist:"1.2 km",inStock:true,delivery:false},{ph:"1mg",brand:"Dolo 650",pack:"15 tablets",price:22,dist:"Delivery 2hrs",inStock:true,delivery:true}],generic:[{ph:"Jan Aushadhi",brand:"Paracetamol 650",pack:"15 tablets",price:8,dist:"0.9 km",inStock:true,delivery:false}],savings:"Save ₹24 with generic", usage:"Take with or without food. Avoid alcohol.", doses:"1 tablet every 6 hours. Max 4000mg/day.", purpose:"Reduces fever and relieves mild to moderate pain."},
  "paracetamol":{branded:[{ph:"Apollo Pharmacy",brand:"Calpol 500",pack:"10 tablets",price:18,dist:"0.4 km",inStock:true,delivery:false},{ph:"1mg",brand:"Crocin 500",pack:"10 tablets",price:12,dist:"Delivery 4hrs",inStock:true,delivery:true}],generic:[{ph:"Jan Aushadhi",brand:"Paracetamol 500",pack:"10 tablets",price:4,dist:"0.9 km",inStock:true,delivery:false}],savings:"Save ₹14 with generic", usage:"Take with or without food. Avoid alcohol.", doses:"1 tablet every 4-6 hours. Max 4000mg/day.", purpose:"Reduces fever and relieves mild to moderate pain."},
  "cetirizine":{branded:[{ph:"Apollo Pharmacy",brand:"Alerid 10",pack:"10 tablets",price:42,dist:"0.4 km",inStock:true,delivery:false},{ph:"1mg",brand:"Zyrtec 10",pack:"10 tablets",price:28,dist:"Delivery 2hrs",inStock:true,delivery:true}],generic:[{ph:"Jan Aushadhi",brand:"Cetirizine 10",pack:"10 tablets",price:8,dist:"0.9 km",inStock:true,delivery:false}],savings:"Save ₹34 with generic", usage:"Take preferably in the evening as it may cause drowsiness.", doses:"10mg once daily.", purpose:"Antihistamine used to relieve allergy symptoms."},
  "metformin":{branded:[{ph:"Apollo Pharmacy",brand:"Glycomet 500",pack:"20 tablets",price:72,dist:"0.4 km",inStock:true,delivery:false},{ph:"1mg",brand:"Obimet 500",pack:"20 tablets",price:55,dist:"Delivery 2hrs",inStock:true,delivery:true}],generic:[{ph:"Jan Aushadhi",brand:"Metformin 500",pack:"20 tablets",price:18,dist:"0.9 km",inStock:true,delivery:false}],savings:"Save ₹54 with generic", usage:"Take with meals to reduce stomach or bowel side effects.", doses:"500mg to 2000mg daily in divided doses as prescribed.", purpose:"Improves blood sugar control in people with type 2 diabetes."},
  "amoxicillin":{branded:[{ph:"Apollo Pharmacy",brand:"Novamox 500",pack:"15 capsules",price:115,dist:"0.4 km",inStock:true,delivery:false},{ph:"1mg",brand:"Mox 500",pack:"15 capsules",price:95,dist:"Delivery 2hrs",inStock:true,delivery:true}],generic:[{ph:"Jan Aushadhi",brand:"Amoxicillin 500",pack:"15 capsules",price:35,dist:"0.9 km",inStock:true,delivery:false}],savings:"Save ₹80 with generic", usage:"Complete the full prescribed course. Do not stop early.", doses:"Typically 500mg every 8 hours. Follow doctor's prescription.", purpose:"Antibiotic used to treat a variety of bacterial infections."},
  "pantoprazole":{branded:[{ph:"Apollo Pharmacy",brand:"Pantocid 40",pack:"15 tablets",price:165,dist:"0.4 km",inStock:true,delivery:false},{ph:"MedPlus",brand:"Pan 40",pack:"15 tablets",price:145,dist:"1.2 km",inStock:true,delivery:false}],generic:[{ph:"Jan Aushadhi",brand:"Pantoprazole 40",pack:"15 tablets",price:22,dist:"0.9 km",inStock:true,delivery:false}],savings:"Save ₹143 with generic", usage:"Take 30 minutes before a meal (usually before breakfast).", doses:"40mg once daily.", purpose:"Reduces stomach acid, treats acid reflux (GERD) and ulcers."},
  "azithromycin":{branded:[{ph:"Apollo Pharmacy",brand:"Azithral 500",pack:"5 tablets",price:130,dist:"0.4 km",inStock:true,delivery:false},{ph:"1mg",brand:"Azee 500",pack:"5 tablets",price:119,dist:"Delivery 2hrs",inStock:true,delivery:true}],generic:[{ph:"Jan Aushadhi",brand:"Azithromycin 500",pack:"5 tablets",price:54,dist:"0.9 km",inStock:true,delivery:false}],savings:"Save ₹76 with generic", usage:"Take on an empty stomach or with food depending on brand instructions.", doses:"Usually 500mg once daily for 3-5 days.", purpose:"Antibiotic for respiratory, skin, and certain other infections."},
};

/* All medicine suggestions from records */
const ALL_PRESCRIBED_MEDS=["Tamsulosin 0.4mg","Deflazacort 6mg","Cystone Tablet","Refresh Tears Eye Drops","Systane Ultra","Ibuprofen 400mg","Calcium + D3 Tablet","Volini Gel","Iron + Folic Acid Tablet"];

const FAMILY=[
  {name:"Avneesh Pathak",rel:"You",age:19,blood:"B+",av:"AP",score:72},
  {name:"Deepika Pathak",rel:"Sister",age:22,blood:"O+",av:"DP",score:91},
  {name:"Ramesh Pathak",rel:"Father",age:54,blood:"A+",av:"RP",score:67},
  {name:"Sunita Pathak",rel:"Mother",age:50,blood:"B-",av:"SP",score:74},
];
const VITALS=[
  {label:"Heart Rate",value:"76",unit:"bpm",icon:"❤️",trend:"Stable",history:[72,75,78,76,74,77,76]},
  {label:"Blood Pressure",value:"122/80",unit:"mmHg",icon:"🩺",trend:"Good",history:[124,122,126,121,119,122,122]},
  {label:"Blood Sugar",value:"97",unit:"mg/dL",icon:"🩸",trend:"Good",history:[100,98,95,99,96,97,97]},
  {label:"SpO₂",value:"98",unit:"%",icon:"🫁",trend:"Good",history:[97,98,99,98,98,99,98]},
];
const SYMPTOMS={
  "headache":{specialist:"Neurologist",urgency:"medium",advice:"Could be tension headache, migraine or dehydration. Monitor 24hrs. See doctor if persists."},
  "chest pain":{specialist:"Cardiologist",urgency:"high",advice:"🚨 Seek immediate attention. Call 112 now. Do not drive yourself."},
  "skin rash":{specialist:"Dermatologist",urgency:"low",advice:"Likely allergic reaction. Avoid irritants. Consult if spreading or with fever."},
  "toothache":{specialist:"Dentist",urgency:"medium",advice:"May be cavity or infection. Avoid hot/cold. Book soon."},
  "fever":{specialist:"General Physician",urgency:"medium",advice:"Stay hydrated. See doctor if above 103°F or lasts 3+ days."},
  "back pain":{specialist:"Orthopedic",urgency:"low",advice:"Rest and apply heat/ice. See doctor if pain radiates down legs."},
  "cough":{specialist:"Pulmonologist",urgency:"low",advice:"Likely viral. See doctor if producing blood or lasting 3+ weeks."},
  "eye pain":{specialist:"Ophthalmologist",urgency:"medium",advice:"Could be dry eye or strain. See specialist if persists beyond 48 hours."},
  "kidney pain":{specialist:"Urologist",urgency:"high",advice:"Sharp flank pain — possible kidney stones. Hydrate and see urologist urgently."},
  "knee pain":{specialist:"Orthopedic",urgency:"medium",advice:"Rest, ice, compress. Book ortho if swelling persists more than 48 hours."},
  "stomach pain":{specialist:"Gastroenterologist",urgency:"medium",advice:"Could be gastritis or IBS. Seek urgent care if pain is severe or sudden."},
  "breathlessness":{specialist:"Pulmonologist",urgency:"high",advice:"🚨 Sit upright, loosen clothing, call 112 if severe."},
  "diabetes":{specialist:"Endocrinologist",urgency:"medium",advice:"Monitor blood glucose. See endocrinologist for HbA1c review."},
  "thyroid":{specialist:"Endocrinologist",urgency:"low",advice:"TSH test recommended. Consult endocrinologist."},
  "depression":{specialist:"Psychiatrist",urgency:"medium",advice:"You are not alone. Seek professional support. Crisis helpline: iCall 9152987821."},
};
const EMERGENCY_HOSPITALS=[
  {name:"AIIMS Emergency",dist:"2.1 km",time:"6 min",type:"Government Trauma Centre",phone:"011-26588500",lat:28.5672,lng:77.2100},
  {name:"Apollo Hospital",dist:"3.4 km",time:"9 min",type:"Private Multi-specialty",phone:"011-26925801",lat:28.5507,lng:77.2247},
  {name:"Safdarjung Hospital",dist:"4.2 km",time:"12 min",type:"Government Hospital",phone:"011-26165060",lat:28.5706,lng:77.2090},
  {name:"Max Super Specialty",dist:"5.1 km",time:"14 min",type:"Private Cardiac Care",phone:"011-26515050",lat:28.5244,lng:77.2046},
  {name:"BLK Super Specialty",dist:"6.3 km",time:"18 min",type:"Private Neurology",phone:"011-30403040",lat:28.6514,lng:77.1907},
];
const EMERGENCY_CONDITIONS={
  "Heart Attack":{icon:"❤️",signs:["Chest pressure or pain","Left arm numbness","Jaw or back pain","Sweating and nausea","Shortness of breath"],first:["Call 112 immediately","Chew aspirin 325mg if not allergic","Loosen tight clothing","Do NOT drive yourself","Stay calm, sit or lie down"]},
  "Stroke":{icon:"🧠",signs:["Sudden face drooping","Arm weakness (one side)","Speech difficulty","Sudden severe headache","Vision loss"],first:["Call 112 — every minute matters","Note time symptoms started","Do NOT give food or water","Keep patient calm","FAST: Face-Arm-Speech-Time"]},
  "Choking":{icon:"🫁",signs:["Cannot speak","Blue lips or face","Clutching throat","High-pitched breathing","Loss of consciousness"],first:["5 firm back blows","5 abdominal thrusts (Heimlich)","Alternate until clear","Call 112 if unconscious","Begin CPR if unresponsive"]},
  "Anaphylaxis":{icon:"⚠️",signs:["Throat swelling","Hives or rash","Difficulty breathing","Rapid weak pulse","Dizziness or fainting"],first:["Use EpiPen if available","Call 112 immediately","Lay flat legs elevated","Second EpiPen after 5-15 min","Don't rely on antihistamines alone"]},
  "Seizure":{icon:"⚡",signs:["Uncontrolled shaking","Loss of consciousness","Muscle stiffening","Temporary confusion","Blank staring"],first:["Clear sharp objects","Do NOT restrain","Place on side","Time the seizure","Call 112 if over 5 minutes"]},
};
const REMINDERS=[
  {id:1,title:"Kidney Stone Follow-up",doctor:"Dr. Vivek Nanda",due:"April 26, 2026",type:"Ultrasound KUB",urgency:"high",icon:"🫀"},
  {id:2,title:"Eye Check-up",doctor:"Dr. Meena Joshi",due:"March 15, 2027",type:"Annual Vision Test",urgency:"low",icon:"👁️"},
  {id:3,title:"Knee Physiotherapy",doctor:"Physio Clinic",due:"Weekly — Every Monday",type:"PT Session",urgency:"medium",icon:"🦵"},
  {id:4,title:"Blood Test (CBC + Iron)",doctor:"City Diagnostics",due:"May 28, 2026",type:"Lab Test",urgency:"medium",icon:"🧪"},
];
const INSURANCE={provider:"HDFC ERGO Health",plan:"Optima Secure — Individual",policyNo:"HE-2024-AP-001122",sumInsured:"₹5,00,000",premium:"₹8,200/yr",expiry:"31 Dec 2026",claims:[{title:"Kidney Stone Treatment",amount:"₹24,500",status:"Settled",date:"Jan 2026"},{title:"Eye Consultation",amount:"₹2,100",status:"Settled",date:"Mar 2026"},{title:"Knee X-Ray & OPD",amount:"₹4,800",status:"Pending",date:"Nov 2025"}],covered:["Hospitalization","Day Care Procedures","Ambulance","Mental Health","Maternity (after 2yr)","Ayush Treatments"],notCovered:["Dental OPD","Cosmetic Surgery","Self-inflicted injuries","Vitamin supplements"]};

/* Live tracking */
let LT={active:false,userLat:28.6139,userLng:77.2090,targetDoc:null,interval:null,step:0};
function getDist(d){const R=6371,dLat=(d.lat-LT.userLat)*Math.PI/180,dLng=(d.lng-LT.userLng)*Math.PI/180;const a=Math.sin(dLat/2)**2+Math.cos(LT.userLat*Math.PI/180)*Math.cos(d.lat*Math.PI/180)*Math.sin(dLng/2)**2;return(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))).toFixed(1);}
function getETA(dist){return Math.max(1,Math.ceil(parseFloat(dist)*3.8));}
function sortByDist(arr){return[...arr].sort((a,b)=>parseFloat(getDist(a))-parseFloat(getDist(b)));}
function sortByRating(arr){return[...arr].sort((a,b)=>b.rating-a.rating);}
function sortByFee(arr){return[...arr].sort((a,b)=>a.fee-b.fee);}
function sortDoctors(arr,mode){if(mode==='rating')return sortByRating(arr);if(mode==='fee')return sortByFee(arr);return sortByDist(arr);}

/* ═══════════════════════════════════════════
   APP STATE
═══════════════════════════════════════════ */
const APP={
  loggedIn:false,loginStep:1,loginPhone:"",loginOtp:"",loginOtpSent:false,loginName:"",loginAge:"",loginBlood:"B+",isNewUser:false,
  onboardingLoading:false,onboardingError:"",profileDetails:null,
  tab:"home",screen:null,
  selDoc:null,selSlot:null,selMode:"clinic",booked:false,
  specFilter:"All",search:"",sortMode:"distance",showSortSidebar:false,
  vaultPin:"",vaultOpen:false,pinErr:false,vaultPinVal:["","","",""],
  records:RECORDS.map(r=>({...r})),showNote:null,showQR:false,
  symInput:"",symRes:null,
  medInput:"",medRes:null,medTab:"branded",activeMedKey:null,
  famIdx:0,activeV:0,
  aiSummary:null,aiLoading:false,aiError:null,
  qTimer:0,qInterval:null,
  emergCondition:null,
  showAddModal: false,
  mapDoc:null,mapMode:"clinics",
  reminderOpen:null,
  orderModal:null,
};

/* ═══════════════════════════════════════════
   STYLE HELPERS
═══════════════════════════════════════════ */
function cs(ac){return`background:${C().card};border-radius:20px;border:1px solid ${ac||C().border}`;}
function c2s(){return`background:${C().card2};border-radius:20px;border:1px solid ${C().border}`;}
function hdr(){return`background:${C().hdrGrad};`;}
const S={
  get h1(){return`font-family:'Syne',sans-serif;font-weight:900;color:${isDark()?'#fff':C().text}`},
  get btn(){return`background:linear-gradient(135deg,${isDark()?'#00a864':'#007a4a'},${C().primary});color:${isDark()?'#000':'#fff'};border:none;border-radius:14px;padding:15px 24px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;width:100%`},
  get btnO(){return`background:transparent;color:${C().primary};border:1.5px solid ${C().primary};border-radius:14px;padding:13px 24px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;width:100%`},
  get btnSm(){return`background:${isDark()?'#0d3326':'#d0f0e0'};color:${C().primary};border:1px solid ${C().primary}44;border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit`},
  get lbl(){return`font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C().muted}`},
};
function pill(a,ac){const p=ac||C().primary;return`background:${a?p:C().card2};color:${a?isDark()?'#000':'#fff':C().dim};border:1px solid ${a?p:C().border};border-radius:100px;padding:7px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;flex-shrink:0`;}
function urgClr(u){return u==="high"?"#e05c5c":u==="medium"?C().gold:C().primary;}
function urgBg(u){return u==="high"?isDark()?'#2d0f0f':'#ffd0d0':u==="medium"?isDark()?'#2a1a00':'#fff3d0':isDark()?'#0d3326':'#d0f0e0';}

function nav(cur){
  const items=[{id:"home",icon:"🏠",label:L("home")},{id:"doctors",icon:"🩺",label:L("doctors")},{id:"ai",icon:"🤖",label:L("aiTab")},{id:"vault",icon:"🔐",label:L("vaultTab")},{id:"profile",icon:"👤",label:L("profileTab")}];
  return`<div style="position:sticky;bottom:0;background:${C().navBg};border-top:1px solid ${C().border};display:flex;justify-content:space-around;padding:10px 0 16px;z-index:100">
    ${items.map(n=>`<div onclick="setTab('${n.id}')" style="display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:5px 12px;border-radius:12px;background:${cur===n.id?C().primary+'15':'transparent'}">
      <span style="font-size:20px">${n.icon}</span>
      <span style="font-size:9px;font-weight:800;letter-spacing:.5px;color:${cur===n.id?C().primary:C().muted}">${n.label}</span>
    </div>`).join('')}
  </div>`;}

/* ═══════════════════════════════════════════
   SORT SIDEBAR
═══════════════════════════════════════════ */
function buildSortSidebar(){
  return`<div class="sidebar-overlay" onclick="APP.showSortSidebar=false;render()"></div>
  <div class="sidebar-panel" style="background:${C().surf};padding:28px 20px;box-shadow:-20px 0 60px #00000044">
    <div style="${S.h1};font-size:20px;margin-bottom:6px">Sort & Filter</div>
    <div style="color:${C().muted};font-size:12px;margin-bottom:24px">Find your ideal doctor</div>
    <div style="${S.lbl};margin-bottom:10px">Sort By</div>
    ${[{k:'distance',ic:'📍',l:'Nearest First',s:'Based on your location'},{k:'rating',ic:'⭐',l:'Highest Rated',s:'Best reviewed doctors'},{k:'fee',ic:'💰',l:'Lowest Fee',s:'Most affordable first'}].map(opt=>`<div onclick="APP.sortMode='${opt.k}';render()" style="background:${APP.sortMode===opt.k?C().primary+'22':C().card};border-radius:14px;padding:14px 16px;margin-bottom:10px;cursor:pointer;border:1.5px solid ${APP.sortMode===opt.k?C().primary:C().border}">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">${opt.ic}</span>
        <div>
          <div style="font-weight:700;color:${APP.sortMode===opt.k?C().primary:C().text};font-size:14px">${opt.l}</div>
          <div style="color:${C().muted};font-size:11px">${opt.s}</div>
        </div>
        ${APP.sortMode===opt.k?`<div style="margin-left:auto;width:20px;height:20px;border-radius:50%;background:${C().primary};display:flex;align-items:center;justify-content:center;font-size:11px;color:#000">✓</div>`:''}
      </div>
    </div>`).join('')}
    <div style="${S.lbl};margin:18px 0 10px">Price Range</div>
    ${[{k:'all',l:'All Prices'},{k:'budget',l:'Under ₹500'},{k:'mid',l:'₹500–₹1200'},{k:'premium',l:'Above ₹1200'}].map(pr=>`<button onclick="APP.priceFilter='${pr.k}';render()" style="${pill(APP.priceFilter===pr.k)};display:block;width:100%;margin-bottom:8px;padding:10px;text-align:left">${pr.l}</button>`).join('')}
    <button onclick="APP.showSortSidebar=false;render()" style="${S.btn};margin-top:16px">Apply Filters</button>
  </div>`;
}

/* ═══════════════════════════════════════════
   ORDER MODAL
═══════════════════════════════════════════ */
function buildOrderModal(){
  const m=APP.orderModal;
  return`<div style="position:fixed;inset:0;background:#00000088;z-index:300;display:flex;align-items:flex-end" onclick="APP.orderModal=null;render()">
    <div onclick="event.stopPropagation()" style="background:${C().surf};border-radius:24px 24px 0 0;padding:28px 22px;width:100%;max-width:430px;margin:0 auto;animation:fadeUp .3s both">
      <div style="${S.h1};font-size:18px;margin-bottom:4px">🛍️ Order Medicine</div>
      <div style="color:${C().primary};font-size:13px;font-weight:700;margin-bottom:18px">${m.brand} · ${m.generic}</div>
      <div style="${c2s()};padding:16px;margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div><div style="font-weight:700;color:${C().text};font-size:14px">${m.ph}</div><div style="color:${C().muted};font-size:12px">${m.pack}</div></div>
          <div style="font-family:'Syne',sans-serif;font-weight:900;font-size:22px;color:${C().primary}">₹${m.price}</div>
        </div>
        <div style="display:flex;gap:8px">
          <div style="flex:1;background:${isDark()?'#0d3326':'#d0f0e0'};border-radius:10px;padding:8px;text-align:center;font-size:11px;color:${C().primary};font-weight:700">${m.delivery?'🚚 Home Delivery':'🏪 Store Pickup'}</div>
          <div style="flex:1;background:${isDark()?'#0a1f14':'#d8f0e8'};border-radius:10px;padding:8px;text-align:center;font-size:11px;color:${C().dim};font-weight:700">📍 ${m.dist}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
        ${m.delivery?`<button onclick="APP.orderModal=null;showToast('Order placed! Delivery in 2-3 hours 🚚');render()" style="${S.btn};padding:14px">🚚 Order Online</button>`:`<button onclick="APP.orderModal=null;showToast('Reservation confirmed at '+APP.orderModal?.ph+' 🏪');render()" style="${S.btn};padding:14px">🏪 Reserve Pickup</button>`}
        <button onclick="APP.orderModal=null;render()" style="${S.btnO};padding:14px">Cancel</button>
      </div>
      <div style="text-align:center;color:${C().muted};font-size:11px">Arogya partners with Apollo, MedPlus, 1mg & Jan Aushadhi for verified medicines.</div>
    </div>
  </div>`;
}

/* ═══════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════ */
function buildLogin(){
  if(APP.loginStep===1)return buildLoginWelcome();
  if(APP.loginStep===2)return buildLoginPhone();
  if(APP.loginStep===3)return buildLoginOTP();
  if(APP.loginStep===4)return buildOnboarding();
  return buildLoginWelcome();
}
function buildLoginWelcome(){
  return`<div class="login-screen" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;background:linear-gradient(160deg,#020a05,#071810,#0a2e1a);position:relative">
    <div style="position:absolute;top:-60px;right:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,#00c87a12,transparent 70%);pointer-events:none"></div>
    <div class="bounce" style="text-align:center;margin-bottom:48px">
      <div style="width:90px;height:90px;border-radius:28px;background:linear-gradient(135deg,#0d3326,#1a7a52);border:2px solid #00c87a44;display:flex;align-items:center;justify-content:center;margin:0 auto 20px">
        <span style="font-family:'Syne',sans-serif;font-size:32px;font-weight:900;color:#00c87a">Ar</span></div>
      <div style="font-family:'Syne',sans-serif;font-size:42px;font-weight:900;color:#fff;letter-spacing:-2px;line-height:1">Arogya</div>
      <div style="color:#00c87a;font-size:12px;font-weight:700;letter-spacing:3px;margin-top:6px">HEALTH · आरोग्य</div>
      <div style="color:#5a7a6a;font-size:14px;margin-top:14px;line-height:1.7">India's most intelligent<br>personal health companion</div>
    </div>
    <div class="ai" style="width:100%;max-width:360px">
      <div style="background:#0c1a12;border:1px solid #1e3228;border-radius:28px;padding:32px 28px">
        <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:900;color:#fff;margin-bottom:8px">Welcome 👋</div>
        <div style="color:#5a7a6a;font-size:13px;margin-bottom:28px">Your health, secured and simplified.</div>
        <button onclick="APP.loginStep=2;APP.isNewUser=false;render()" style="background:linear-gradient(135deg,#00a864,#00c87a);color:#000;border:none;border-radius:14px;padding:15px 24px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;width:100%;margin-bottom:12px">🔐 Login with Mobile</button>
        <button onclick="APP.loginStep=2;APP.isNewUser=true;render()" style="background:transparent;color:#00c87a;border:1.5px solid #00c87a;border-radius:14px;padding:13px 24px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;width:100%">✨ Create Account</button>
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid #1e3228;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          ${["🔒 Encrypted","🩺 Verified Experts","💊 Best Prices","🆘 Emergency"].map(f=>`<div style="background:#162920;border-radius:8px;padding:5px 10px;font-size:11px;color:#5a7a6a;font-weight:600">${f}</div>`).join('')}
        </div>
      </div>
    </div>
  </div>`;}
function buildLoginPhone(){
  return`<div class="login-screen" style="background:linear-gradient(160deg,#020a05,#071810,#0a2e1a);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px">
    <div class="ai" style="width:100%;max-width:360px">
      <div onclick="APP.loginStep=1;render()" style="color:#5a7a6a;font-size:13px;font-weight:700;cursor:pointer;margin-bottom:24px">← Back</div>
      <div style="background:#0c1a12;border:1px solid #1e3228;border-radius:28px;padding:32px 28px">
        <div style="font-family:'Syne',sans-serif;font-size:24px;font-weight:900;color:#fff;margin-bottom:24px">${APP.isNewUser?'Create Account':'Welcome Back'}</div>
        <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5a7a6a;margin-bottom:10px">Mobile Number</div>
        <div style="display:flex;gap:10px;margin-bottom:20px">
          <div style="background:#162920;border:1px solid #1e3228;border-radius:12px;padding:14px 16px;font-size:14px;color:#5a7a6a;font-weight:700;flex-shrink:0">🇮🇳 +91</div>
          <input id="phoneInput" type="tel" maxlength="10" placeholder="" value="${APP.loginPhone}" oninput="APP.loginPhone=this.value.replace(/\\D/g,'')" style="flex:1;background:#162920;border:1.5px solid #1e3228;border-radius:12px;padding:14px 16px;font-size:16px;font-weight:700;color:#00c87a;outline:none;font-family:inherit;-webkit-text-fill-color:#00c87a">
        </div>
        <button onclick="sendOTP()" style="background:linear-gradient(135deg,#00a864,#00c87a);color:#000;border:none;border-radius:14px;padding:15px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;width:100%;opacity:${APP.loginPhone.length===10?1:.5}">Send OTP →</button>
        <div style="margin-top:16px;background:#162920;border-radius:10px;padding:12px;text-align:center;border:1px dashed #1e3228">
          <div style="font-size:11px;color:#3a5a4a">Demo: Any 10-digit number · OTP: <strong style="color:#00c87a">123456</strong></div>
        </div>
      </div>
    </div>
  </div>`;}
// Replace buildLoginOTP() inside your app.js with this:
function buildLoginOTP(){
  return`<div class="login-screen" style="background:linear-gradient(160deg,#020a05,#071810,#0a2e1a);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px">
    <div class="ai" style="width:100%;max-width:360px">
      <div onclick="APP.loginStep=2;render()" style="color:#5a7a6a;font-size:13px;font-weight:700;cursor:pointer;margin-bottom:24px">← Back</div>
      <div style="background:#0c1a12;border:1px solid #1e3228;border-radius:28px;padding:32px 28px;text-align:center">
        <div style="font-size:40px;margin-bottom:16px">📱</div>
        <div style="font-family:'Syne',sans-serif;font-size:24px;font-weight:900;color:#fff;margin-bottom:8px">Verify OTP</div>
        <div style="color:#5a7a6a;font-size:13px;margin-bottom:20px">Sent to +91 ${APP.loginPhone}</div>
        
        <div style="margin-bottom:20px">
          <input id="otpSingleInput" type="text" maxlength="6" placeholder="· · · · · ·" 
                 value="${APP.loginOtp || ''}" 
                 oninput="APP.loginOtp=this.value.replace(/\\D/g,'')" 
                 style="background:#162920;border:2px solid #1e3228;border-radius:12px;padding:14px;font-size:24px;font-weight:900;color:#00c87a;text-align:center;letter-spacing:8px;outline:none;width:100%;font-family:'Syne',sans-serif;-webkit-text-fill-color:#00c87a">
        </div>

        <button onclick="verifyOTP()" style="background:linear-gradient(135deg,#00a864,#00c87a);color:#000;border:none;border-radius:14px;padding:15px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;width:100%;margin-bottom:12px">Verify →</button>
        <div style="color:#5a7a6a;font-size:13px">Didn't receive? <span onclick="sendOTP()" style="color:#00c87a;font-weight:700;cursor:pointer">Resend</span></div>
      </div>
    </div>
  </div>`;
}
function buildOnboarding(){
  return`<div class="login-screen" style="background:linear-gradient(160deg,#020a05,#071810,#0a2e1a);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px">
    <div class="ai" style="width:100%;max-width:360px">
      <div style="background:#0c1a12;border:1px solid #1e3228;border-radius:28px;padding:32px 28px">
        <div style="font-family:'Syne',sans-serif;font-size:24px;font-weight:900;color:#fff;margin-bottom:8px">Complete your account</div>
        <div style="color:#5a7a6a;font-size:13px;line-height:1.6;margin-bottom:24px">Choose how you want to add your verified ABHA details.</div>
        ${APP.onboardingError?`<div style="background:#2d0f0f;color:#e05c5c;border:1px solid #e05c5c55;border-radius:10px;padding:10px 12px;font-size:12px;font-weight:700;margin-bottom:16px">${APP.onboardingError}</div>`:''}
        <label for="abhaFile" style="display:block;background:#0d3326;color:#00c87a;border:1px solid #00c87a66;border-radius:14px;padding:15px;text-align:center;font-size:14px;font-weight:800;cursor:pointer;margin-bottom:10px">📄 Upload ABHA ID text file</label>
        <input id="abhaFile" type="file" accept=".txt,text/plain" onchange="uploadABHA(this.files[0])" style="display:none">
        <button onclick="linkDigiLocker()" style="background:transparent;color:#4d9de0;border:1.5px solid #4d9de0;border-radius:14px;padding:13px 24px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;width:100%">🇮🇳 Link DigiLocker</button>
        ${APP.onboardingLoading?`<div style="text-align:center;color:#00c87a;font-size:12px;font-weight:700;margin-top:16px">Verifying and saving your ABHA details...</div>`:''}
        <div style="color:#5a7a6a;font-size:11px;line-height:1.6;margin-top:18px;text-align:center">Your details are stored in the connected DigiLocker drive and used to set up your profile.</div>
      </div>
    </div>
  </div>`;}

/* ═══════════════════════════════════════════
   HOME
═══════════════════════════════════════════ */
function buildHome(){
  const profileName=APP.loginName||'User';
  const fam=FAMILY[APP.famIdx],score=fam.score,scoreClr=score>=85?C().primary:score>=70?C().gold:"#e05c5c";
  return`<div class="ai">
    <div style="${hdr()}padding:52px 20px 20px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
        <div>
          <div style="font-family:'Syne',sans-serif;font-size:32px;font-weight:900;letter-spacing:-1.5px;color:${isDark()?'#fff':C().text};line-height:1">Arogya<span style="font-size:10px;color:${C().primary};margin-left:8px;font-weight:700;letter-spacing:2px">HEALTH</span></div>
          <div style="color:${C().muted};font-size:13px;margin-top:8px">${L("greeting")}, ${profileName} 👋</div>
          <div style="color:${C().muted};font-size:12px;margin-top:2px">📍 ${L("greeting2")}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
          <div style="display:flex;gap:8px">
            <div onclick="setScreen('settings')" style="width:36px;height:36px;border-radius:50%;background:${isDark()?'#162920':C().card2};border:1px solid ${C().border};display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer">⚙️</div>
            <div onclick="setScreen('emergency')" style="width:42px;height:42px;border-radius:50%;background:${isDark()?'#2d0f0f':'#ffd0d0'};border:1.5px solid #e05c5c;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer" class="epulse">🆘</div>
          </div>
          <div style="background:${isDark()?'#0d3326':'#d0f0e0'};border:1px solid ${C().primary}44;border-radius:10px;padding:4px 10px;display:flex;align-items:center;gap:5px">
            <span class="live" style="font-size:8px;color:${C().primary}">●</span>
            <span style="font-size:10px;color:${C().dim}">All systems normal</span>
          </div>
        </div>
      </div>
    </div>
    <div style="padding:16px 18px 90px;overflow-y:auto;max-height:calc(100vh - 198px)">
      <!-- Family strip -->
      <div style="display:flex;gap:10px;margin-bottom:16px;overflow-x:auto;scrollbar-width:none">
        ${FAMILY.map((f,i)=>`<div onclick="setFamIdx(${i})" style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer">
          <div style="width:46px;height:46px;border-radius:50%;background:${APP.famIdx===i?C().primary:C().card2};border:2px solid ${APP.famIdx===i?C().primary:C().border};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:${APP.famIdx===i?isDark()?'#000':'#fff':C().dim}">${f.av}</div>
          <div style="font-size:10px;color:${APP.famIdx===i?C().primary:C().muted};font-weight:700">${f.rel}</div>
        </div>`).join('')}
        <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:5px"><div style="width:46px;height:46px;border-radius:50%;background:${C().card2};border:2px dashed ${C().border};display:flex;align-items:center;justify-content:center;font-size:22px;color:${C().muted};cursor:pointer">+</div><div style="font-size:10px;color:${C().muted};font-weight:700">Add</div></div>
      </div>
      <!-- Health score -->
      <div style="background:linear-gradient(135deg,${isDark()?'#0c1812,#0d2e1e':'#d8f5e8,#e8ffe8'});border-radius:22px;padding:20px;margin-bottom:16px;border:1px solid ${scoreClr}33">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="${S.lbl};margin-bottom:6px">${L("healthScore")} — ${fam.name}</div>
            <div style="font-family:'Syne',sans-serif;font-size:54px;font-weight:900;color:${scoreClr};line-height:1">${score}</div>
            <div style="color:${C().muted};font-size:12px;margin-top:6px">${score>=85?'🟢 '+L("excellent"):score>=70?'🟡 '+L("good"):'🔴 '+L("attention")}</div>
          </div>
          <div style="width:80px;height:80px;position:relative;flex-shrink:0">
            <svg width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="32" fill="none" stroke="${C().border}" stroke-width="8"/><circle cx="40" cy="40" r="32" fill="none" stroke="${scoreClr}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${(score/100)*201} 201" transform="rotate(-90 40 40)"/></svg>
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:${scoreClr}">${score}%</div>
          </div>
        </div>
      </div>
      <!-- Quick actions -->
      <div style="${S.lbl};margin-bottom:10px">⚡ Quick Actions</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
        ${[{icon:"🤒",title:L("symptomChecker"),sub:"AI finds right doctor",bg:isDark()?"#0d2e1e":"#d0f0e0",ac:C().primary,act:"setScreen('ai-symptom')"},{icon:"💊",title:L("medicineFinder"),sub:"Best prices nearby",bg:isDark()?"#2a1a00":"#fff0d0",ac:C().gold,act:"setScreen('ai-medicine')"},{icon:"📊",title:L("tracker"),sub:"Vitals & trends",bg:isDark()?"#0a1520":"#d0e8f5",ac:"#4d9de0",act:"setScreen('tracker')"},{icon:"🆘",title:L("emergency"),sub:"Hospitals & first aid",bg:isDark()?"#2d0f0f":"#ffd0d0",ac:"#e05c5c",act:"setScreen('emergency')"}].map(it=>`<div onclick="${it.act}" style="background:${it.bg};border-radius:18px;padding:16px;cursor:pointer;border:1px solid ${it.ac}22">
          <div style="font-size:26px;margin-bottom:8px">${it.icon}</div>
          <div style="font-weight:800;color:${C().text};font-size:13px">${it.title}</div>
          <div style="font-size:11px;color:${it.ac};margin-top:3px;font-weight:600">${it.sub}</div>
        </div>`).join('')}
      </div>
      <!-- Top Doctors -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="${S.lbl}">Top Doctors Near You</div>
        <span onclick="setTab('doctors')" style="color:${C().primary};font-size:12px;font-weight:700;cursor:pointer">See all →</span>
      </div>
      ${sortByDist(DOCTORS).slice(0,3).map(doc=>`<div onclick="goDoc(${doc.id})" style="${cs()};padding:16px;margin-bottom:10px;cursor:pointer;display:flex;gap:14px;align-items:center">
        <div style="width:52px;height:52px;border-radius:16px;background:${doc.clr};border:1px solid ${doc.ac}44;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:${doc.ac};flex-shrink:0">${doc.av}</div>
        <div style="flex:1">
          <div style="font-weight:700;color:${C().text};font-size:14px">${doc.name} ${doc.verified?"✅":""}</div>
          <div style="color:${C().muted};font-size:12px">${doc.specialty} · ${getDist(doc)} km</div>
          <div style="display:flex;gap:10px;margin-top:4px"><span style="font-size:12px;color:#f59e0b;font-weight:700">⭐ ${doc.rating}</span><span style="color:${C().primary};font-weight:700;font-size:12px">₹${doc.fee}</span></div>
        </div>
        <div style="background:${doc.next==='Today'?isDark()?'#0d3326':'#d0f0e0':'#2a1a00'};color:${doc.next==='Today'?C().primary:C().gold};padding:4px 10px;border-radius:8px;font-size:10px;font-weight:800;white-space:nowrap">${doc.next}</div>
      </div>`).join('')}
    </div>
    ${nav('home')}
  </div>`;}

/* ═══════════════════════════════════════════
   DOCTORS — with sort sidebar
═══════════════════════════════════════════ */
function buildDoctors(){
  const specs=["All","Dermatologist","Dentist","Cardiologist","Orthopedic","Pediatrician","Neurologist","Ophthalmologist","General Physician","Gynecologist","Urologist","Endocrinologist","Nephrologist","Psychiatrist","Pulmonologist","Gastroenterologist"];
  let filtered=DOCTORS.filter(d=>(APP.specFilter==="All"||d.specialty===APP.specFilter)&&(d.name.toLowerCase().includes(APP.search.toLowerCase())||d.specialty.toLowerCase().includes(APP.search.toLowerCase())||d.location.toLowerCase().includes(APP.search.toLowerCase())));
  if(APP.priceFilter==='budget')filtered=filtered.filter(d=>d.fee<500);
  else if(APP.priceFilter==='mid')filtered=filtered.filter(d=>d.fee>=500&&d.fee<=1200);
  else if(APP.priceFilter==='premium')filtered=filtered.filter(d=>d.fee>1200);
  const sorted=sortDoctors(filtered,APP.sortMode||'distance');
  const sortIcon=APP.sortMode==='rating'?'⭐':APP.sortMode==='fee'?'💰':'📍';
  return`<div class="ai">
    <div style="padding:52px 20px 14px;background:${C().surf};border-bottom:1px solid ${C().border}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div style="${S.h1};font-size:26px">${L("findDoctors")}</div>
        <button onclick="APP.showSortSidebar=true;render()" style="background:${isDark()?'#162920':C().card2};color:${C().primary};border:1px solid ${C().primary}44;border-radius:12px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px">${sortIcon} Sort <span style="font-size:10px">▼</span></button>
      </div>
      <div style="background:${C().card2};border-radius:14px;padding:11px 16px;display:flex;align-items:center;gap:10px;border:1px solid ${C().border};margin-bottom:12px">
        <span>🔍</span>
        <input value="${APP.search}" oninput="APP.search=this.value;render()" placeholder="${L("searchPlaceholder")}" style="background:transparent;border:none;outline:none;color:${C().text};font-size:14px;flex:1;font-family:inherit">
        ${APP.search?`<span onclick="APP.search='';render()" style="color:${C().muted};cursor:pointer;font-size:18px">×</span>`:''}
      </div>
      <div style="display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:4px">
        ${specs.map(sp=>`<button onclick="APP.specFilter='${sp}';render()" style="${pill(APP.specFilter===sp)};font-size:11px">${sp}</button>`).join('')}
      </div>
    </div>
    <div style="padding:12px 18px 90px;overflow-y:auto;max-height:calc(100vh - 220px)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="color:${C().muted};font-size:13px">${sorted.length} ${L("doctorsFound")}</div>
        <div style="background:${isDark()?'#0d3326':'#d0f0e0'};color:${C().primary};font-size:10px;font-weight:700;padding:4px 10px;border-radius:8px">${sortIcon} ${APP.sortMode==='rating'?'Best Rated':APP.sortMode==='fee'?'Cheapest':'Nearest'} first</div>
      </div>
      ${sorted.map((doc,idx)=>`<div onclick="goDoc(${doc.id})" style="${cs()};padding:16px;margin-bottom:12px;cursor:pointer;${idx===0?'border:1px solid '+C().primary+'55;':''}">
        ${idx===0&&APP.specFilter!=="All"?`<div style="background:${C().primary};color:#000;font-size:10px;font-weight:800;padding:3px 10px;border-radius:6px;display:inline-block;margin-bottom:10px">🏆 TOP ${APP.specFilter.toUpperCase()}</div>`:''}
        <div style="display:flex;gap:12px">
          <div style="width:58px;height:58px;border-radius:18px;background:${doc.clr};border:1px solid ${doc.ac}44;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:${doc.ac};flex-shrink:0">${doc.av}</div>
          <div style="flex:1">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div>
                <div style="font-weight:700;font-size:14px;color:${C().text}">${doc.name} ${doc.verified?"✅":""}</div>
                <div style="font-size:12px;color:${doc.ac};font-weight:600">${doc.specialty}</div>
                <div style="font-size:11px;color:${C().muted};margin-top:2px">📍 ${doc.location}</div>
              </div>
              <div style="text-align:right">
                <div style="font-family:'Syne',sans-serif;font-weight:900;font-size:18px;color:${C().text}">₹${doc.fee}</div>
                <div style="font-size:10px;color:${C().muted}">per visit</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap">
              <span style="font-size:12px;color:#f59e0b;font-weight:700">⭐ ${doc.rating}</span>
              <span style="color:${C().primary};font-weight:700;font-size:11px">📍 ${getDist(doc)} km</span>
              <span style="color:${C().gold};font-weight:700;font-size:11px">🕐 ${getETA(getDist(doc))} min</span>
              <div style="margin-left:auto;background:${doc.next==='Today'?isDark()?'#0d3326':'#d0f0e0':'#2a1a00'};color:${doc.next==='Today'?C().primary:C().gold};padding:3px 10px;border-radius:8px;font-size:10px;font-weight:800">${doc.next}</div>
            </div>
            <div style="display:flex;gap:6px;margin-top:8px">
              ${doc.mode.includes("video")?`<span style="background:${isDark()?'#0a1f38':'#d0e8f8'};color:#4d9de0;font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px">📹 Video</span>`:''}
              <span style="background:${isDark()?'#0a1f14':'#d0f0e0'};color:${C().primary};font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px">Queue: ${doc.queue}</span>
              <span onclick="event.stopPropagation();openMap(${doc.id})" style="background:${isDark()?'#0d2318':'#d0f0e0'};color:${C().primary};font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;cursor:pointer">📍 Map</span>
            </div>
          </div>
        </div>
      </div>`).join('')}
    </div>
    ${nav('doctors')}
  </div>`;}

  // Function for Doctor Portal or Test UI to push documents to DigiLocker
window.doctorUploadToDigiLocker = async (title, docType, doctorName, clinicalNote) => {
  try {
    const res = await fetch('http://127.0.0.1:8000/auth/mock-api/public/oauth2/1/files/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title || "Blood Test & Lipid Profile",
        type: docType || "Lab Report",
        doctor_name: doctorName || "Dr. Rajesh Verma (Max Healthcare)",
        note: clinicalNote || "HbA1c: 5.6%, Total Cholesterol: 180 mg/dL. All parameters normal."
      })
    });
    
    const data = await res.json();
    if (res.ok) {
      showToast("Prescription/Report pushed to DigiLocker! 📋");
    } else {
      showToast(data.error || "Upload failed");
    }
  } catch (err) {
    console.error("Upload error:", err);
    showToast("Network error uploading to DigiLocker");
  }
};

/* ═══════════════════════════════════════════
   MAP — Clinics + Emergency mode
═══════════════════════════════════════════ */
function buildMap(){
  const doc=APP.mapDoc;
  const mode=APP.mapMode||'clinics';
  const toXY=(lat,lng)=>({x:Math.max(12,Math.min(388,28+(lng-77.0)/(77.55-77.0)*372)),y:Math.max(12,Math.min(358,355-(lat-28.38)/(28.75-28.38)*346))});
  const user=toXY(LT.userLat,LT.userLng);
  const displayDocs=doc?[doc]:sortByDist(DOCTORS).slice(0,12);
  const nearest=sortByDist(DOCTORS)[0];
  const target=doc||nearest;
  const tPos=toXY(target.lat,target.lng);
  const mid={x:(user.x+tPos.x)/2,y:(user.y+tPos.y)/2-25};
  const distVal=getDist(target);
  const etaVal=getETA(distVal);
  return`<div class="app-screen ai">
    <div style="${hdr()}padding:52px 20px 14px">
      <div onclick="setScreen(null)" style="color:${C().dim};font-size:13px;font-weight:700;cursor:pointer;margin-bottom:10px">← Back</div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="${S.h1};font-size:20px">📍 ${doc?doc.name:mode==='emergency'?'Emergency Hospitals':'Nearby Clinics'}</div>
          <div style="color:${C().muted};font-size:12px;margin-top:2px">${doc?doc.specialty+' · '+doc.location:'Sorted by distance from you'}</div>
        </div>
        <button onclick="toggleLiveTracking()" style="background:${LT.active?'#e05c5c22':'#0d3326'};color:${LT.active?'#e05c5c':C().primary};border:1px solid ${LT.active?'#e05c5c':C().primary+'44'};border-radius:10px;padding:8px 14px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit">${LT.active?'⏹ Stop':'📡 Live'}</button>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button onclick="APP.mapMode='clinics';render()" style="${pill(mode==='clinics')};font-size:11px">🏥 Clinics</button>
        <button onclick="APP.mapMode='emergency';render()" style="${pill(mode==='emergency','#e05c5c')};font-size:11px">🚨 Emergency</button>
        <button onclick="APP.mapMode='pharmacy';render()" style="${pill(mode==='pharmacy',C().gold)};font-size:11px">💊 Pharmacy</button>
      </div>
    </div>
    ${LT.active?`<div style="margin:6px 14px;background:${isDark()?'#1a0505':'#ffd0d0'};border-radius:10px;padding:10px 14px;border:1px solid #e05c5c44;display:flex;gap:8px;align-items:center">
      <span class="live" style="color:#e05c5c;font-size:10px">●</span>
      <span style="color:#e05c5c;font-size:12px;font-weight:800">LIVE</span>
      <span style="color:${C().muted};font-size:11px">→ ${target.name}</span>
      <div style="margin-left:auto;display:flex;gap:12px">
        <div style="text-align:right"><div style="color:#e05c5c;font-weight:900;font-size:14px" id="liveETA">${etaVal} min</div></div>
        <div style="text-align:right"><div style="color:${C().muted};font-size:11px" id="liveDist">${distVal} km</div></div>
      </div>
    </div>`:''}
    <div style="margin:8px 14px 0;border-radius:18px;overflow:hidden;border:1px solid ${C().border}">
      <iframe width="100%" height="370" style="border:0;display:block;" loading="lazy" allowfullscreen src="https://maps.google.com/maps?q=${doc ? encodeURIComponent(doc.clinic + ' ' + doc.location) : mode === 'emergency' ? 'Emergency+Hospitals+near+me' : mode === 'pharmacy' ? 'Pharmacy+near+me' : 'Clinics+near+me'}&t=&z=13&ie=UTF8&iwloc=&output=embed"></iframe>
    </div>
    <div style="padding:10px 14px 90px;overflow-y:auto;max-height:200px">
      ${mode==='emergency'?`<div style="${S.lbl};margin-bottom:8px">Nearest Emergency Hospitals</div>${EMERGENCY_HOSPITALS.slice(0,3).map((h,i)=>`<div style="${cs(i===0?'#e05c5c44':'')};padding:12px 14px;margin-bottom:8px;background:${i===0?isDark()?'#2d0f0f':'#ffd0d0':C().card};display:flex;gap:10px;align-items:center">
        <div style="flex:1"><div style="font-weight:700;color:${C().text};font-size:13px">${h.name}</div><div style="color:${C().muted};font-size:11px">${h.type} · ${h.dist} · ${h.time}</div></div>
        <a href="tel:${h.phone}" style="background:#e05c5c22;color:#e05c5c;border:1px solid #e05c5c44;border-radius:8px;padding:6px 10px;font-size:11px;font-weight:700;text-decoration:none">📞 Call</a>
      </div>`).join('')}`
      :mode==='pharmacy'?`<div style="${S.lbl};margin-bottom:8px">Nearby Pharmacies</div>${[{n:"Apollo Pharmacy",d:"0.4 km",st:true},{n:"MedPlus",d:"1.2 km",st:true},{n:"Jan Aushadhi",d:"0.9 km",st:true},{n:"1mg Delivery",d:"2hrs",st:true}].map(ph=>`<div style="${cs()};padding:12px 14px;margin-bottom:8px;display:flex;gap:10px;align-items:center">
        <span style="font-size:18px">💊</span>
        <div style="flex:1"><div style="font-weight:700;color:${C().text};font-size:13px">${ph.n}</div><div style="color:${C().muted};font-size:11px">📍 ${ph.d}</div></div>
        <button onclick="setScreen('ai-medicine')" style="${S.btnSm}">Order</button>
      </div>`).join('')}`
      :`<div style="${S.lbl};margin-bottom:8px">${doc?'Clinic Details':'All Clinics Nearby'}</div>
      ${doc?`<div style="${cs(doc.ac+'44')};padding:14px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><div style="font-weight:700;color:${C().text};font-size:14px">${doc.name}</div><div style="color:${doc.ac};font-size:12px">${doc.clinic}</div><div style="color:${C().muted};font-size:11px;margin-top:2px">📍 ${doc.location} · ${getDist(doc)} km · ${getETA(getDist(doc))} min</div></div>
          <button onclick="goDoc(${doc.id})" style="${S.btn};width:auto;padding:10px 14px;font-size:13px">Book →</button>
        </div>
      </div>`:sortByDist(DOCTORS).slice(0,6).map((d,i)=>`<div onclick="goDoc(${d.id})" style="${cs()};padding:12px;margin-bottom:8px;cursor:pointer;${i===0?'border:1px solid '+C().primary+'44;':''}display:flex;gap:10px;align-items:center">
        <div style="width:38px;height:38px;border-radius:12px;background:${d.clr};border:1px solid ${d.ac}44;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:${d.ac};flex-shrink:0">${d.av}</div>
        <div style="flex:1"><div style="font-weight:700;color:${C().text};font-size:13px">${i===0?'🏆 ':''} ${d.name}</div><div style="color:${C().muted};font-size:11px">${d.specialty}</div></div>
        <div style="text-align:right"><div style="font-family:'Syne',sans-serif;font-weight:900;font-size:14px;color:${i===0?C().primary:C().text}">${getDist(d)} km</div><div style="color:${C().gold};font-size:10px;font-weight:700">${getETA(getDist(d))} min</div></div>
      </div>`).join('')}`}
    </div>
    ${nav(APP.tab)}
  </div>`;}

/* ═══════════════════════════════════════════
   EMERGENCY
═══════════════════════════════════════════ */
function buildEmergency(){
  return`<div class="app-screen ai">
    <div style="background:linear-gradient(160deg,${isDark()?'#1a0505,#2d0f0f':'#ffd0d0,#ffe8e8'});padding:52px 20px 18px;border-bottom:1px solid ${isDark()?'#3d1515':'#f0a0a0'}">
      <div onclick="setScreen(null)" style="color:#e05c5c;font-size:13px;font-weight:700;cursor:pointer;margin-bottom:12px">← Back</div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <div style="width:44px;height:44px;border-radius:14px;background:#e05c5c22;border:1.5px solid #e05c5c;display:flex;align-items:center;justify-content:center;font-size:22px" class="epulse">🆘</div>
        <div><div style="${S.h1};font-size:24px;color:#e05c5c">${L("emergency")}</div><div style="color:${isDark()?'#c08080':'#a05050'};font-size:12px">Nearest hospitals + first aid</div></div>
      </div>
      <div style="background:#e05c5c22;border-radius:12px;padding:12px 16px;border:1px solid #e05c5c44;display:flex;justify-content:space-between;align-items:center">
        <div><div style="font-weight:800;color:${C().text};font-size:13px">📞 Emergency</div><div style="color:#e05c5c;font-size:26px;font-weight:900;font-family:'Syne',sans-serif">112</div></div>
        <div style="text-align:center"><div style="color:${isDark()?'#c08080':'#a05050'};font-size:12px">Ambulance</div><div style="color:#e05c5c;font-size:22px;font-weight:900;font-family:'Syne',sans-serif">102</div></div>
        <div style="text-align:right"><div style="color:${isDark()?'#c08080':'#a05050'};font-size:12px">iCall Mental</div><div style="color:#e05c5c;font-size:13px;font-weight:900;font-family:'Syne',sans-serif">9152987821</div></div>
      </div>
    </div>
    <div style="padding:14px 18px 90px;overflow-y:auto;max-height:calc(100vh - 240px)">
      <!-- Live Map Button -->
      <button onclick="APP.mapMode='emergency';setScreen('map')" style="background:${isDark()?'#2d0f0f':'#ffd0d0'};color:#e05c5c;border:1.5px solid #e05c5c44;border-radius:14px;padding:14px;width:100%;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;margin-bottom:14px;display:flex;align-items:center;justify-content:center;gap:8px">
        🗺️ View Emergency Hospitals on Live Map →
      </button>
      <div style="${S.lbl};margin-bottom:10px">Nearest Emergency Hospitals</div>
      ${EMERGENCY_HOSPITALS.map((h,i)=>`<div style="background:${i===0?isDark()?'#2d0f0f':'#ffd0d0':C().card};border-radius:16px;padding:14px;margin-bottom:10px;border:1px solid ${i===0?'#e05c5c66':C().border}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
          <div><div style="font-weight:800;color:${C().text};font-size:13px">${i===0?'🏆 ':''} ${h.name}</div><div style="color:${C().dim};font-size:12px">${h.type}</div></div>
          <div style="text-align:right"><div style="${S.btnSm};cursor:default">${h.time}</div><div style="color:${C().muted};font-size:11px;margin-top:4px">${h.dist}</div></div>
        </div>
        <div style="display:flex;gap:8px">
          <a href="tel:${h.phone}" style="flex:1;background:${isDark()?'#0d2318':'#d0f0e0'};color:${C().primary};border:1px solid ${C().primary}44;border-radius:8px;padding:8px 12px;font-size:12px;font-weight:700;text-decoration:none;text-align:center">📞 ${h.phone}</a>
          <button onclick="APP.mapMode='emergency';setScreen('map')" style="${S.btnSm}">📍 Map</button>
        </div>
      </div>`).join('')}
      <div style="${S.lbl};margin:18px 0 10px">Emergency First Aid Guide</div>
      ${Object.entries(EMERGENCY_CONDITIONS).map(([name,data])=>`<div onclick="APP.emergCondition=APP.emergCondition==='${name}'?null:'${name}';render()" style="background:${APP.emergCondition===name?isDark()?'#2d0f0f':'#ffd0d0':C().card};border-radius:16px;padding:14px;margin-bottom:10px;cursor:pointer;border:1px solid ${APP.emergCondition===name?'#e05c5c66':C().border}">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:10px"><span style="font-size:22px">${data.icon}</span><span style="font-weight:800;color:${C().text};font-size:14px">${name}</span></div>
          <span style="color:#e05c5c;font-size:16px">${APP.emergCondition===name?'▲':'▼'}</span>
        </div>
        ${APP.emergCondition===name?`<div style="margin-top:14px">
          <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#e05c5c;margin-bottom:8px">Warning Signs</div>
          ${data.signs.map(s=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px"><div style="width:5px;height:5px;border-radius:50%;background:#e05c5c;flex-shrink:0"></div><span style="color:${C().text};font-size:12px">${s}</span></div>`).join('')}
          <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${C().primary};margin:12px 0 8px">What To Do</div>
          ${data.first.map((s,i)=>`<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:7px"><div style="width:18px;height:18px;border-radius:50%;background:${isDark()?'#0d3326':'#d0f0e0'};border:1px solid ${C().primary};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;color:${C().primary};flex-shrink:0">${i+1}</div><span style="color:${C().text};font-size:12px;line-height:1.6">${s}</span></div>`).join('')}
        </div>`:''}</div>`).join('')}
    </div>
    ${nav(APP.tab)}
  </div>`;}

/* ═══════════════════════════════════════════
   VAULT — with QR and medicine ordering
═══════════════════════════════════════════ */
function buildVault(){
  return`<div class="ai">
    <div style="padding:52px 20px 18px;background:${isDark()?'linear-gradient(160deg,#0c1812,#0d0a2e)':C().surf};border-bottom:1px solid ${C().border}">
      <div style="${S.h1};font-size:26px;margin-bottom:4px">${L("vault")} 🔐</div>
      <div style="color:${C().muted};font-size:13px">${L("vaultSub")}</div>
    </div>
    <div style="padding:16px 18px 90px;overflow-y:auto;max-height:calc(100vh - 170px)">
      ${!APP.vaultOpen?buildVaultLocked():buildVaultOpen()}
    </div>
    ${nav('vault')}
  </div>`;}

function buildVaultLocked(){
  return`<div style="${c2s()};padding:36px 28px;text-align:center;margin-top:10px">
    <div style="width:80px;height:80px;border-radius:50%;background:radial-gradient(circle,#a78bfa22,transparent);border:1.5px solid #a78bfa44;display:flex;align-items:center;justify-content:center;font-size:36px;margin:0 auto 20px">🔒</div>
    <div style="${S.h1};font-size:20px;margin-bottom:8px">${L("vaultLocked")}</div>
    <div style="color:${C().muted};font-size:13px;margin-bottom:10px">${L("demoPin")}</div>
    <div style="display:flex;gap:10px;justify-content:center;margin-bottom:10px">
      ${[0,1,2,3].map(i=>`<input id="pin${i}" type="password" inputmode="numeric" maxlength="1" oninput="pinDigit(${i},this.value)" onkeydown="pinKeydown(event,${i})" class="pin-box ${APP.pinErr?'err':APP.vaultPinVal[i]?'filled':''}">`).join('')}
    </div>
    ${APP.pinErr?`<div style="color:#e05c5c;font-size:13px;font-weight:700;margin-bottom:12px">❌ Wrong PIN. Hint: 1234</div>`:''}
    <button onclick="unlockVault()" style="${S.btn};background:linear-gradient(135deg,#6d28d9,#a78bfa);color:#fff;margin-top:8px">${L("unlockVault")}</button>
  </div>`;}

function buildVaultOpen(){
  const profileName=APP.loginName||'User';
  return`<div>
    <div style="background:${isDark()?'linear-gradient(135deg,#1a0a2e,#2d1060)':C().card2};border-radius:16px;padding:14px;display:flex;align-items:center;gap:12px;margin-bottom:14px;border:1px solid #a78bfa44">
      <span style="font-size:20px">🔓</span>
      <div style="flex:1"><div style="font-weight:800;color:${C().text};font-size:13px">Vault Unlocked · AES-256</div><div style="font-size:11px;color:#a78bfa">Auto-locks 5 min · Zero-knowledge</div></div>
      <button onclick="lockVault()" style="background:#a78bfa22;color:#a78bfa;border:1px solid #a78bfa44;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">Lock</button>
    </div>

    <!-- THE NEW TRIGGER BUTTON -->
    <div style="${cs()};padding:16px;margin-bottom:14px;text-align:center;border:1px solid #4d9de044;background:${isDark()?'#0a1f38':'#f0f8ff'}">
      <div style="font-size:32px;margin-bottom:8px">🇮🇳</div>
      <div style="font-weight:800;color:${C().text};font-size:14px;margin-bottom:4px">Sync Government Records</div>
      <div style="color:${C().muted};font-size:12px;margin-bottom:12px">Securely import ABHA & Vaccination certificates from DigiLocker</div>
      <button onclick="connectDigiLocker()" style="${S.btn};background:linear-gradient(135deg, #1e3a8a, #3b82f6);color:#fff">
        Connect DigiLocker →
      </button>
    </div>

    ${APP.vaultLoading ? `<div style="text-align:center;padding:30px 20px">
      <div style="width:40px;height:40px;border-radius:50%;border:3px solid ${C().border};border-top-color:${C().primary};margin:0 auto 16px" class="spin"></div>
      <div style="font-weight:800;color:${C().primary};font-size:14px;margin-bottom:4px">Syncing DigiLocker...</div>
      <div style="color:${C().muted};font-size:12px">Securely fetching your government health records</div>
    </div>` : ''}

    <!-- Emergency QR -->
    <div style="${cs('#e05c5c44')};padding:16px;margin-bottom:14px;background:${isDark()?'#180808':'#fff5f5'}">
      <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer" onclick="APP.showQR=!APP.showQR;render()">
        <div>
          <div style="font-weight:800;color:${C().text};font-size:14px">🆘 Emergency QR Code</div>
          <div style="color:#e05c5c;font-size:11px;margin-top:2px">First responders can scan — no PIN needed</div>
        </div>
        <span style="background:#e05c5c22;color:#e05c5c;border-radius:8px;padding:6px 10px;font-size:11px;font-weight:700">${APP.showQR?'Hide ▲':'Show ▼'}</span>
      </div>
      ${APP.showQR?`<div style="margin-top:16px">
        <div style="display:flex;gap:16px;align-items:flex-start">
          <div style="background:#fff;border-radius:14px;padding:12px;flex-shrink:0">
            ${genQR('https://arogya-doctor.vercel.app/emergency?patient=' + encodeURIComponent(profileName), 110)}
            <div style="text-align:center;font-size:9px;color:#e05c5c;font-weight:700;margin-top:4px">EMERGENCY ACCESS</div>
          </div>
          <div style="flex:1">
            <div style="background:#e05c5c22;border-radius:10px;padding:10px;border:1px solid #e05c5c33">
              <div style="font-size:10px;font-weight:800;color:#e05c5c;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">⚠️ Critical Info (Public)</div>
              ${[["👤 Name",profileName],["🩸 Blood",APP.loginBlood||"Not provided"],["💊 Allergy",APP.profileDetails?.allergies||"Not provided"],["📋 Condition",APP.profileDetails?.condition||"Not provided"],["📞 Emergency",APP.profileDetails?.emergency_contact||"Not provided"]].map(([k,v])=>`<div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="color:${C().muted};font-size:10px">${k}</span><span style="color:${isDark()?'#fff':C().text};font-weight:700;font-size:10px">${v}</span></div>`).join('')}
            </div>
            <div style="margin-top:8px;background:${isDark()?'#0d3326':'#d0f0e0'};border-radius:8px;padding:8px;font-size:10px;color:${C().primary};line-height:1.5">🔒 Medical records stay encrypted. Only above info is accessible without PIN.</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button onclick="showToast('QR saved to photos ✓')" style="${S.btn};padding:11px">📥 Save QR</button>
          <button onclick="showToast('QR shared via WhatsApp ✓')" style="${S.btnO};padding:11px">📤 Share</button>
        </div>
      </div>`:''}
    </div>
    <!-- Prescribed medicines quick order -->
    <div style="${cs(C().gold+'44')};padding:14px;margin-bottom:14px;background:${isDark()?'#2a1a00':'#fffaed'}">
      <div style="${S.lbl};color:${C().gold};margin-bottom:10px">💊 Prescribed Medicines — Order Now</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${ALL_PRESCRIBED_MEDS.map(m=>`<button onclick="openMedOrder('${m.toLowerCase()}')" style="background:${isDark()?'#162920':'#d0f0e0'};color:${C().primary};border:1px solid ${C().primary}44;border-radius:8px;padding:6px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">💊 ${m}</button>`).join('')}
      </div>
    </div>
    <!-- Records -->
    <div style="${S.lbl};margin-bottom:12px">Your Records (${APP.records.length})</div>
    ${APP.records.map(rec=>`<div style="${cs(rec.shared?C().gold+'44':'')};padding:16px;margin-bottom:12px">
      <div style="display:flex;gap:12px;align-items:flex-start">
        <div style="width:48px;height:48px;border-radius:14px;background:${rec.ac}22;border:1px solid ${rec.ac}44;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">${rec.icon}</div>
        <div style="flex:1">
          <div style="font-weight:700;color:${C().text};font-size:14px">${rec.title}</div>
          <div style="color:${C().muted};font-size:12px;margin-top:2px">${rec.doctor} · ${rec.date}</div>
          <span style="background:${rec.ac}22;color:${rec.ac};font-size:10px;font-weight:800;padding:3px 8px;border-radius:6px;margin-top:6px;display:inline-block">${rec.type}</span>
        </div>
      </div>
      ${rec.note?`<div onclick="APP.showNote=APP.showNote===${rec.id}?null:${rec.id};render()" style="font-size:12px;color:#4d9de0;font-weight:700;margin-top:10px;cursor:pointer">📋 ${L("doctorNote")} ${APP.showNote===rec.id?'▲':'▼'}</div>
      ${APP.showNote===rec.id?`<div style="background:${isDark()?'#0a1f38':'#e8f0f8'};border-radius:10px;padding:12px;margin-top:8px;border-left:3px solid #4d9de0;font-size:12px;color:${C().text};line-height:1.7">${rec.note}</div>`:''}`:''} 
      ${rec.medicines&&rec.medicines.length?`<div style="margin-top:10px">
        <div style="font-size:10px;font-weight:700;color:${C().muted};margin-bottom:6px;text-transform:uppercase;letter-spacing:1px">Prescribed · Compare Prices & Order</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${rec.medicines.map(m=>`<button onclick="openMedOrder('${m.toLowerCase()}')" style="background:${isDark()?'#162920':'#d0f0e0'};color:${C().primary};border:1px solid ${C().primary}44;border-radius:8px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">💊 ${m} →</button>`).join('')}
        </div>
      </div>`:''}
      ${!rec.shared?`<div style="margin-top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <span style="font-size:11px;color:${C().muted};font-weight:700;flex:1">${L("grantAccess")}</span>
        ${[2,6,24].map(h=>`<button onclick="toggleShare(${rec.id},${h})" style="${S.btnSm}">${h}h</button>`).join('')}
      </div>`:`<div style="margin-top:12px;background:${isDark()?'#1a1200':'#fffbee'};border-radius:14px;padding:16px;border:1px solid ${C().gold}44">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div>
            <div style="color:${C().gold};font-size:12px;font-weight:800">🔓 Shared · ${rec.sharedUntil} remaining</div>
            <div style="color:${C().muted};font-size:10px;margin-top:2px">Doctor can scan QR to access record</div>
          </div>
          <button onclick="toggleShare(${rec.id},0)" style="background:#e05c5c22;color:#e05c5c;border:1px solid #e05c5c44;border-radius:8px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">${L("revoke")}</button>
        </div>
        <div style="background:${isDark()?'#0d0a00':'#fffef0'};border-radius:10px;padding:12px;border:1px solid ${C().gold}22;display:flex;gap:14px;align-items:center">
          <div style="flex-shrink:0;background:#fff;border-radius:10px;padding:8px;display:inline-block">${genQR('https://arogya-doctor.vercel.app/?patient=Avneesh+Pathak&record=' + encodeURIComponent(rec.title) + '&valid=' + encodeURIComponent(rec.sharedUntil), 90)}</div>
          <div style="flex:1">
            <div style="font-size:11px;font-weight:800;color:${C().text};margin-bottom:4px">🔲 Doctor Access QR</div>
            <div style="font-size:10px;color:${C().muted};line-height:1.8">Record: ${rec.title}<br>Valid: ${rec.sharedUntil}<br><span style="color:#a78bfa;font-weight:700">arogya-doctor.vercel.app</span></div>
            <button onclick="event.stopPropagation();window.open('https://arogya-doctor.vercel.app/?patient=Avneesh+Pathak&record='+encodeURIComponent('${rec.title}')+'&valid=${rec.sharedUntil}','_blank')" style="margin-top:6px;background:#a78bfa22;color:#a78bfa;border:1px solid #a78bfa44;border-radius:7px;padding:5px 10px;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit">🔗 Open Doctor Portal →</button>
          </div>
        </div>
      </div>`}
    </div>`).join('')}
    <!-- Change from APP.showAddModal = true; render(); -->
    <button onclick="openAddModal()" style="${S.btn};background:linear-gradient(135deg,#6d28d9,#a78bfa);color:#fff;margin-top:4px">${L("addRecord")}</button>
  </div>
  
  <!-- Paste the Modal HTML block I gave you in the previous step right here, before the final backtick! -->
  <!-- PUT THE MODAL HTML RIGHT HERE -->
    ${APP.showAddModal ? `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:999;padding:16px">
        <div style="background:${isDark() ? '#1e293b' : '#ffffff'};color:${isDark() ? '#f8fafc' : '#0f172a'};border-radius:16px;padding:20px;width:100%;max-width:420px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.3)">
          
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
            <h3 style="margin:0;font-size:16px;font-weight:800">${(LD[APP.lang] || LD.en).addRecord}</h3>
            <button onclick="APP.showAddModal = false; render();" style="background:none;border:none;font-size:18px;cursor:pointer;color:inherit">✕</button>
          </div>

          <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">Document Title</label>
          <input id="vaultDocTitle" placeholder="e.g. CBC Blood Report" style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1;margin-bottom:12px;box-sizing:border-box" />

          <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">Record Category</label>
          <select id="vaultDocType" style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1;margin-bottom:12px;box-sizing:border-box">
            <option value="Prescription">Prescription</option>
            <option value="Lab Report">Lab Report</option>
            <option value="Vaccination">Vaccination Certificate</option>
          </select>

          <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">Doctor / Issuer (Optional)</label>
          <input id="vaultDocIssuer" placeholder="e.g. Dr. Rajesh Verma" style="width:100%;padding:10px;border-radius:8px;border:1px solid #cbd5e1;margin-bottom:16px;box-sizing:border-box" />

          <div style="display:flex;gap:10px">
            <button onclick="APP.showAddModal = false; render();" style="${S.btn};background:#94a3b8;color:#fff;flex:1">Cancel</button>
            <button onclick="saveRecordToDigiLocker()" style="${S.btn};background:#0284c7;color:#fff;flex:1;font-weight:700">Save to Vault</button>
          </div>
        </div>
      </div>
    ` : ''}
  `; // <-- THIS IS THE FINAL BACKTICK FOR THE FUNCTION
}



/* ═══════════════════════════════════════════
   MEDICINE FINDER — Extended with ordering
═══════════════════════════════════════════ */
function buildMedicine(){
  const list=APP.medRes?(APP.medTab==='generic'&&APP.medRes.generic?APP.medRes.generic:APP.medRes.branded)||[]:[];
  return`<div class="app-screen ai">
    <div style="${hdr()}padding:52px 20px 18px">
      <div onclick="setScreen(null)" style="color:${C().dim};font-size:13px;font-weight:700;cursor:pointer;margin-bottom:12px">← Back</div>
      <div style="${S.h1};font-size:24px">💊 ${L("medicineFinder")}</div>
      <div style="color:${C().muted};font-size:13px;margin-top:4px">Compare prices · Order online or from store</div>
    </div>
    <div style="padding:16px 18px 100px;overflow-y:auto;max-height:calc(100vh - 172px)">
      <div style="${c2s()};padding:14px;margin-bottom:12px;display:flex;gap:10px;align-items:center">
        <span>🔍</span>
        <input id="medInput" value="${APP.medInput}" placeholder="Search medicine (e.g. Tamsulosin, Dolo 650...)" oninput="APP.medInput=this.value" style="background:transparent;border:none;outline:none;color:${C().text};font-size:14px;font-family:inherit;flex:1">
        ${APP.medInput?`<span onclick="APP.medInput='';APP.medRes=null;render()" style="color:${C().muted};cursor:pointer;font-size:18px">×</span>`:''}
      </div>
      <div style="${S.lbl};margin-bottom:8px">Prescribed Medicines</div>
      <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">
        ${ALL_PRESCRIBED_MEDS.map(m=>`<button onclick="setMedInput('${m}')" style="${pill(APP.medInput.toLowerCase()===m.toLowerCase())};font-size:10px;padding:5px 10px">${m}</button>`).join('')}
      </div>
      <div style="${S.lbl};margin-bottom:8px">Common Medicines</div>
      <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap">
        ${["Dolo 650","Paracetamol","Cetirizine","Metformin","Amoxicillin","Pantoprazole","Azithromycin"].map(m=>`<button onclick="setMedInput('${m}')" style="${pill(APP.medInput.toLowerCase()===m.toLowerCase())};font-size:10px;padding:5px 10px">${m}</button>`).join('')}
      </div>
      <button onclick="checkMed()" style="${S.btn};opacity:${APP.medInput?1:.4}">Compare Prices →</button>
      ${APP.medRes?`<div style="margin-top:18px" class="ai">
        ${APP.medRes.purpose?`<div style="${c2s()};padding:14px;margin-bottom:14px;border:1px solid ${C().border};border-radius:14px">
          <div style="display:flex;gap:10px;margin-bottom:10px"><span style="font-size:16px">🎯</span><div><div style="font-weight:800;font-size:13px;color:${C().text};margin-bottom:2px">What it is for</div><div style="color:${C().muted};font-size:12px;line-height:1.6">${APP.medRes.purpose}</div></div></div>
          <div style="display:flex;gap:10px;margin-bottom:10px"><span style="font-size:16px">⏱️</span><div><div style="font-weight:800;font-size:13px;color:${C().text};margin-bottom:2px">When to use</div><div style="color:${C().muted};font-size:12px;line-height:1.6">${APP.medRes.usage}</div></div></div>
          <div style="display:flex;gap:10px"><span style="font-size:16px">⚖️</span><div><div style="font-weight:800;font-size:13px;color:${C().text};margin-bottom:2px">Safe Doses</div><div style="color:${C().muted};font-size:12px;line-height:1.6">${APP.medRes.doses}</div></div></div>
        </div>`:''}
        ${APP.medRes.generic?`<div style="display:flex;gap:8px;margin-bottom:10px">
          <button onclick="APP.medTab='branded';render()" style="${pill(APP.medTab==='branded')};flex:1;padding:10px">💊 Branded</button>
          <button onclick="APP.medTab='generic';render()" style="${pill(APP.medTab==='generic','#a78bfa')};flex:1;padding:10px">🧪 Generic (Cheaper)</button>
        </div>
        ${APP.medTab==='generic'&&APP.medRes.savings?`<div style="background:${isDark()?'#0a2218':'#d0f0e0'};border-radius:10px;padding:10px 14px;margin-bottom:12px;border:1px solid ${C().primary}44;font-size:12px;color:${C().primary};font-weight:700">💡 ${APP.medRes.savings}</div>`:''}`:''} 
        <div style="${S.lbl};margin-bottom:10px">Results for "${APP.medInput}"</div>
        ${list.map((r,i)=>`<div style="${cs(i===0?C().primary+'44':'')};padding:16px;margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
            <div style="flex:1">${r.bestPrice?`<div style="color:${C().primary};font-size:10px;font-weight:800;margin-bottom:4px">✓ ${L("bestPrice")}</div>`:''}
              <div style="font-weight:700;color:${C().text};font-size:14px">${r.ph}</div>
              <div style="color:${C().muted};font-size:12px">${r.brand} · ${r.pack}</div>
              <div style="color:${C().dim};font-size:11px;margin-top:2px">📍 ${r.dist} ${r.delivery?'· 🚚 Delivery available':''}</div>
            </div>
            <div style="text-align:right;flex-shrink:0;margin-left:12px">
              <div style="font-family:'Syne',sans-serif;font-weight:900;font-size:24px;color:${i===0?C().primary:C().text}">₹${r.price}</div>
              <div style="font-size:11px;color:${r.inStock?C().primary:'#e05c5c'};font-weight:700">${r.inStock?L("inStock"):L("outOfStock")}</div>
            </div>
          </div>
          ${r.inStock?`<div style="display:flex;gap:8px">
            ${r.delivery?`<button onclick="APP.orderModal=${JSON.stringify(r).replace(/'/g,"\\'")} ;render()" style="${S.btn};padding:10px;font-size:12px">🚚 Order for Delivery</button>`
            :`<button onclick="APP.orderModal=${JSON.stringify(r).replace(/'/g,"\\'")} ;render()" style="${S.btn};padding:10px;font-size:12px">🏪 Reserve Pickup</button>`}
            <button onclick="showToast('Added to cart ✓')" style="${S.btnO};padding:10px;font-size:12px">🛒</button>
          </div>`:`<div style="background:${isDark()?'#2d0f0f':'#ffd0d0'};border-radius:8px;padding:8px 12px;font-size:12px;color:#e05c5c;font-weight:700">❌ Out of Stock at this pharmacy</div>`}
        </div>`).join('')}
      </div>`:''}
    </div>
    ${nav(APP.tab)}
  </div>`;}


/* ═══════════════════════════════════════════
   SYMPTOM CHECKER
═══════════════════════════════════════════ */
function buildSymptom(){
  return`<div class="app-screen ai">
    <div style="${hdr()}padding:52px 20px 18px">
      <div onclick="setScreen(null)" style="color:${C().dim};font-size:13px;font-weight:700;cursor:pointer;margin-bottom:12px">← Back</div>
      <div style="${S.h1};font-size:24px">🤖 ${L("symptomChecker")}</div>
      <div style="color:${C().muted};font-size:13px;margin-top:4px">Describe what you feel. AI finds the right specialist.</div>
    </div>
    <div style="padding:16px 18px 100px;overflow-y:auto;max-height:calc(100vh - 172px)">
      <div style="${c2s()};padding:14px;margin-bottom:12px">
        <!-- ADDED oninput HANDLER HERE -->
        <textarea id="symInput" oninput="APP.symInput=this.value" placeholder="e.g. I have a severe headache with dizziness since morning..." style="background:transparent;border:none;outline:none;color:${C().text};font-size:14px;font-family:inherit;width:100%;height:90px">${APP.symInput}</textarea>
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
          ${["headache","fever","chest pain","skin rash","toothache","back pain","eye pain","kidney pain","knee pain","stomach pain","breathlessness","thyroid","depression"].map(sy=>`<button onclick="setSymInput('${sy}')" style="${pill(APP.symInput===sy)};padding:5px 10px;font-size:11px">${sy}</button>`).join('')}
        </div>
      </div>
      <button onclick="checkSym()" style="${S.btn};opacity:${APP.symInput?1:.4}">Analyse Symptoms →</button>
      ${APP.symRes?`<div style="margin-top:18px" class="ai">
        <div style="background:${urgBg(APP.symRes.urgency)};border-radius:20px;padding:20px;border:1px solid ${urgClr(APP.symRes.urgency)}44">
          <div style="display:flex;justify-content:space-between;margin-bottom:12px">
            <div style="${S.h1};font-size:16px">AI Analysis</div>
            <span style="background:${urgClr(APP.symRes.urgency)}33;color:${urgClr(APP.symRes.urgency)};font-size:11px;font-weight:800;padding:4px 10px;border-radius:8px;text-transform:uppercase">${APP.symRes.urgency} urgency</span>
          </div>
          <div style="color:${C().dim};font-size:13px;line-height:1.75;margin-bottom:14px">${APP.symRes.advice}</div>
          <div style="${cs()};padding:12px;display:flex;align-items:center;gap:12px">
            <span style="font-size:24px">🩺</span>
            <div><div style="font-size:10px;color:${C().muted};font-weight:700;text-transform:uppercase;letter-spacing:1px">Recommended Specialist</div><div style="font-weight:800;color:${C().text};font-size:15px">${APP.symRes.specialist}</div></div>
          </div>
        </div>
        <button onclick="gotoSpecialty('${APP.symRes.specialist}')" style="${S.btn};margin-top:12px">Find ${APP.symRes.specialist}s Near Me →</button>
      </div>`:''}
    </div>
    ${nav(APP.tab)}
  </div>`;}

/* ═══════════════════════════════════════════
   AI HUB
═══════════════════════════════════════════ */
function buildAIHub(){
  return`<div class="ai">
    <div style="padding:52px 20px 18px;background:${isDark()?'linear-gradient(160deg,#0c1812,#0d1a0d)':C().surf}">
      <div style="${S.h1};font-size:28px;margin-bottom:4px">${L("aiHub")} 🤖</div>
      <div style="color:${C().muted};font-size:13px">Your intelligent health companion</div>
    </div>
    <div style="padding:16px 18px 90px;overflow-y:auto;max-height:calc(100vh - 170px)">
      ${[{icon:"🤒",title:L("symptomChecker"),desc:"Describe symptoms — AI finds the right specialist instantly.",bg:isDark()?"#0d2e1e":"#d0f0e0",ac:C().primary,act:"setScreen('ai-symptom')"},{icon:"💊",title:L("medicineFinder"),desc:"Compare branded vs generic. Order from Apollo, MedPlus, Jan Aushadhi.",bg:isDark()?"#2a1a00":"#fff0d0",ac:C().gold,act:"setScreen('ai-medicine')"},{icon:"📊",title:L("tracker"),desc:"Log BP, blood sugar, heart rate. See 7-day trends.",bg:isDark()?"#0a1520":"#d0e8f5",ac:"#4d9de0",act:"setScreen('tracker')"},{icon:"📋",title:L("aiSummary"),desc:"AI generates a complete 1-page health brief from your vault.",bg:isDark()?"#1a0a2e":"#f0eeff",ac:"#a78bfa",act:"setScreen('ai-summary')"},{icon:"🔔",title:L("reminders"),desc:"AI-powered follow-up schedule for tests and appointments.",bg:isDark()?"#0d2000":"#d8f0e0",ac:"#4ade80",act:"setScreen('reminders')"},{icon:"🛡️",title:L("insurance"),desc:"View policy, claims history and cashless hospitals.",bg:isDark()?"#200d0d":"#ffd0d0",ac:"#e05c5c",act:"setScreen('insurance')"},{icon:"🆘",title:L("emergency"),desc:"Nearest hospitals on live map + step-by-step first aid.",bg:isDark()?"#2d0f0f":"#ffd0d0",ac:"#e05c5c",act:"setScreen('emergency')"},{icon:"📍",title:"Nearby Clinics Map",desc:"All top doctors on interactive map. Live tracking & ETA.",bg:isDark()?"#0a1f10":"#d0f0e0",ac:"#34d399",act:"openMap(null)"}].map(it=>`<div onclick="${it.act}" style="background:${it.bg};border-radius:20px;padding:18px;margin-bottom:12px;cursor:pointer;border:1px solid ${it.ac}22;display:flex;gap:14px;align-items:center">
        <div style="font-size:34px;flex-shrink:0">${it.icon}</div>
        <div style="flex:1"><div style="${S.h1};font-size:15px">${it.title}</div><div style="font-size:12px;color:${it.ac};margin-top:4px;line-height:1.6">${it.desc}</div></div>
        <div style="font-size:18px;color:${it.ac};flex-shrink:0">›</div>
      </div>`).join('')}
    </div>
    ${nav('ai')}
  </div>`;}

/* ═══════════════════════════════════════════
   AI SUMMARY
═══════════════════════════════════════════ */
function buildAISummary(){
  const fam=FAMILY[APP.famIdx];
  return`<div class="app-screen ai">
    <div style="background:${isDark()?'linear-gradient(160deg,#0c1812,#1a0a2e)':C().surf};padding:52px 20px 18px;border-bottom:1px solid ${C().border}">
      <div onclick="setScreen(null)" style="color:${C().dim};font-size:13px;font-weight:700;cursor:pointer;margin-bottom:12px">← Back</div>
      <div style="${S.h1};font-size:24px">📋 ${L("aiSummary")}</div>
      <div style="color:${C().muted};font-size:13px;margin-top:4px">One-page brief for your next doctor visit</div>
    </div>
    <div style="padding:16px 18px 90px;overflow-y:auto;max-height:calc(100vh - 172px)">
      <div style="${c2s()};padding:14px;margin-bottom:16px">
        <div style="${S.lbl};margin-bottom:10px">Generate For</div>
        <div style="display:flex;gap:10px;align-items:center">
          ${FAMILY.map((f,i)=>`<div onclick="APP.famIdx=${i};APP.aiSummary=null;APP.aiError=null;render()" style="display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer">
            <div style="width:44px;height:44px;border-radius:50%;background:${APP.famIdx===i?C().primary:C().card2};border:2px solid ${APP.famIdx===i?C().primary:C().border};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:${APP.famIdx===i?isDark()?'#000':'#fff':C().dim}">${f.av}</div>
            <div style="font-size:10px;color:${APP.famIdx===i?C().primary:C().muted};font-weight:700">${f.rel}</div>
          </div>`).join('')}
        </div>
      </div>
      ${APP.aiLoading?`<div style="${c2s()};padding:40px;text-align:center">
        <div style="width:56px;height:56px;border-radius:50%;border:3px solid ${C().border};border-top-color:#a78bfa;margin:0 auto 20px" class="spin"></div>
        <div style="color:#a78bfa;font-weight:800;font-size:16px;margin-bottom:8px">Generating AI Summary...</div>
        <div style="color:${C().muted};font-size:13px;line-height:1.7">Reading ${APP.records.length} records · Powered by Claude AI</div>
      </div>`:APP.aiError?`<div style="${cs('#e05c5c44')};padding:24px;text-align:center">
        <div style="font-size:40px;margin-bottom:12px">⚠️</div>
        <div style="font-weight:800;color:#e05c5c;margin-bottom:8px">Could Not Generate</div>
        <div style="color:${C().muted};font-size:13px;margin-bottom:16px">${APP.aiError}</div>
        <button onclick="generateAISummary()" style="${S.btn}">🔄 Try Again</button>
      </div>`:APP.aiSummary?`<div class="ai">
        <div style="background:${isDark()?'linear-gradient(135deg,#0d0a2e,#1a0a2e)':C().card2};border-radius:20px;padding:20px;border:1px solid #a78bfa44;margin-bottom:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <div style="display:flex;align-items:center;gap:10px"><span style="font-size:24px">🤖</span>
              <div><div style="${S.h1};font-size:15px">AI Summary — ${fam.name}</div><div style="color:#a78bfa;font-size:11px">Generated · Claude AI · ${new Date().toLocaleDateString('en-IN')}</div></div>
            </div>
            <div style="background:#a78bfa22;color:#a78bfa;padding:4px 10px;border-radius:8px;font-size:10px;font-weight:800">READY</div>
          </div>
          <div style="white-space:pre-wrap;color:${C().text};font-size:13px;line-height:1.85;background:${isDark()?'#080616':'#ffffff'};border-radius:14px;padding:16px;border:1px solid #a78bfa22">${APP.aiSummary}</div>
        </div>
        <div style="display:flex;gap:10px;margin-bottom:12px">
          <button onclick="copyAISummary()" style="${S.btn};flex:1;padding:12px">📋 ${L("copy")}</button>
          <button onclick="APP.aiSummary=null;APP.aiError=null;render()" style="${S.btnO};flex:0.5;padding:12px">🔄</button>
        </div>
      </div>`:`<div style="${c2s()};padding:24px;text-align:center">
        <div style="font-size:52px;margin-bottom:16px">🧠</div>
        <div style="${S.h1};font-size:18px;margin-bottom:8px">Smart Health Brief</div>
        <div style="color:${C().muted};font-size:13px;line-height:1.7;margin-bottom:20px">AI analyses all vault records, prescriptions and vitals to create a complete 1-page doctor brief in seconds.</div>
        <button onclick="generateAISummary()" style="${S.btn};background:linear-gradient(135deg,#6d28d9,#a78bfa);color:#fff">✨ ${L("generateSummary")}</button>
      </div>`}
    </div>
    ${nav(APP.tab)}
  </div>`;}

/* ═══════════════════════════════════════════
   TRACKER
═══════════════════════════════════════════ */
function buildTracker(){
  const v=VITALS[APP.activeV],mx=Math.max(...v.history),mn=Math.min(...v.history);
  return`<div class="app-screen ai">
    <div style="padding:52px 20px 16px;background:${C().surf};border-bottom:1px solid ${C().border}">
      <div onclick="setScreen(null)" style="color:${C().dim};font-size:13px;font-weight:700;cursor:pointer;margin-bottom:12px">← Back</div>
      <div style="${S.h1};font-size:24px">📊 ${L("tracker")}</div>
    </div>
    <div style="padding:16px 18px 100px;overflow-y:auto;max-height:calc(100vh - 175px)">
      <div style="display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin-bottom:14px;padding-bottom:4px">
        ${VITALS.map((vi,i)=>`<button onclick="APP.activeV=${i};render()" style="${pill(APP.activeV===i)}">${vi.icon} ${vi.label}</button>`).join('')}
      </div>
      <div style="${c2s()};padding:20px;margin-bottom:14px;border:1px solid ${C().primary}44">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px">
          <div><div style="${S.lbl};margin-bottom:6px">${v.icon} ${v.label}</div><div style="font-family:'Syne',sans-serif;font-size:48px;font-weight:900;color:${C().primary};line-height:1">${v.value}</div><div style="color:${C().muted};font-size:13px;margin-top:4px">${v.unit}</div></div>
          <div style="${S.btnSm};cursor:default">✓ ${v.trend}</div>
        </div>
        <div style="${S.lbl};margin-bottom:8px">7-Day Trend</div>
        <div style="display:flex;gap:5px;align-items:flex-end;height:60px">
          ${v.history.map((val,i)=>{const pct=mx===mn?50:((val-mn)/(mx-mn))*42+16;return`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px"><div style="width:100%;height:${pct}px;border-radius:5px;background:${i===6?C().primary:C().primary+'44'}"></div><div style="font-size:9px;color:${C().muted}">D${i+1}</div></div>`;}).join('')}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
        ${VITALS.map((vi,i)=>`<div onclick="APP.activeV=${i};render()" style="${cs()};padding:16px;cursor:pointer;border:1px solid ${APP.activeV===i?C().primary+'44':C().border}">
          <div style="font-size:22px;margin-bottom:6px">${vi.icon}</div>
          <div style="font-family:'Syne',sans-serif;font-weight:900;font-size:20px;color:${APP.activeV===i?C().primary:C().text}">${vi.value}</div>
          <div style="font-size:11px;color:${C().muted};margin-top:2px">${vi.label}</div>
        </div>`).join('')}
      </div>
      <button style="${S.btn}">+ Log New Reading</button>
    </div>
    ${nav(APP.tab)}
  </div>`;}

/* ═══════════════════════════════════════════
   BOOKING
═══════════════════════════════════════════ */
function buildBooking(){
  const doc=APP.selDoc;if(!doc)return'';
  if(APP.booked)return`<div class="app-screen ai">
    <div style="background:linear-gradient(160deg,${isDark()?'#0c1812':C().card2},${doc.clr});padding:52px 20px 24px">
      <div onclick="setScreen(null);APP.booked=false;render()" style="color:${C().dim};font-size:13px;font-weight:700;cursor:pointer;margin-bottom:16px">← Back</div>
      <div style="text-align:center">
        <div style="width:90px;height:90px;border-radius:50%;background:#00c87a11;border:2px solid ${C().primary};display:flex;align-items:center;justify-content:center;font-size:44px;margin:0 auto 20px">✅</div>
        <div style="${S.h1};font-size:28px">Confirmed!</div>
        <div style="color:${C().dim};font-size:13px;margin-top:8px;line-height:1.9"><strong style="color:${C().text}">${doc.name}</strong><br>${APP.selSlot} · Today · ${APP.selMode==='video'?'Video Call':'In-Clinic'}</div>
      </div>
    </div>
    <div style="padding:20px 18px 90px">
      <div style="${c2s()};padding:18px;margin-bottom:14px">
        ${[["Doctor",doc.name],["Token","#"+(doc.queue+1)],["Time",APP.selSlot+", Today"],["Mode",APP.selMode==="video"?"📹 Video":"🏥 In-Clinic"],["Amount","₹"+doc.fee]].map(([k,v])=>`<div style="display:flex;justify-content:space-between;margin-bottom:10px"><span style="color:${C().dim};font-size:13px">${k}</span><span style="font-weight:700;color:${k==='Amount'?C().primary:C().text};font-size:13px">${v}</span></div>`).join('')}
      </div>
      <div style="${cs()};padding:14px;margin-bottom:14px;border:1px solid ${C().primary}44;text-align:center">
        <div style="${S.lbl};margin-bottom:6px">🔴 Live Wait</div>
        <div style="font-family:'Syne',sans-serif;font-size:40px;font-weight:900;color:${C().primary}" id="qTimerDisp">${APP.qTimer} <span style="font-size:14px;color:${C().muted}">mins</span></div>
      </div>
      <button onclick="setScreen(null);APP.booked=false;render()" style="${S.btn}">Done →</button>
    </div>
    ${nav(APP.tab)}
  </div>`;
  return`<div class="app-screen ai">
    <div style="background:linear-gradient(160deg,${isDark()?'#0c1812':C().card2},${doc.clr});padding:52px 20px 20px">
      <div onclick="setScreen(null);render()" style="color:${C().dim};font-size:13px;font-weight:700;cursor:pointer;margin-bottom:14px">← Back</div>
      <div style="display:flex;gap:14px;align-items:center">
        <div style="width:68px;height:68px;border-radius:20px;background:${doc.clr};border:2px solid ${doc.ac};display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:${doc.ac}">${doc.av}</div>
        <div>
          <div style="${S.h1};font-size:19px">${doc.name} ${doc.verified?"✅":""}</div>
          <div style="color:${doc.ac};font-weight:700;font-size:13px">${doc.specialty}</div>
          <div style="color:${C().dim};font-size:12px">${doc.clinic} · ${doc.location}</div>
          <div style="color:${C().primary};font-size:11px;font-weight:700;margin-top:2px">📍 ${getDist(doc)} km · ETA ${getETA(getDist(doc))} min</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:16px">
        ${[["Experience",doc.exp+" yrs"],["Rating","⭐ "+doc.rating],["On-Time",doc.punctuality+"%"]].map(([l,v])=>`<div style="${c2s()};padding:10px 8px;text-align:center"><div style="font-weight:800;font-size:14px;color:${C().text}">${v}</div><div style="font-size:10px;color:${C().muted};margin-top:2px">${l}</div></div>`).join('')}
      </div>
    </div>
    <div style="padding:16px 18px 100px;overflow-y:auto;max-height:calc(100vh - 270px)">
      <div style="${cs(doc.ac+'44')};padding:14px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="${S.lbl}">Live Queue</div>
          <span class="live" style="background:${isDark()?'#0d3326':'#d0f0e0'};color:${C().primary};font-size:11px;font-weight:800;padding:3px 10px;border-radius:6px">● LIVE</span>
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">
          ${Array.from({length:Math.min(doc.queue+5,16)},(_,i)=>`<div style="width:28px;height:28px;border-radius:8px;background:${i<doc.queue?doc.ac+'33':i===doc.queue?doc.ac:C().card2};border:1px solid ${i<=doc.queue?doc.ac:C().border};display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:${i===doc.queue?isDark()?'#000':'#fff':i<doc.queue?doc.ac:C().muted}">${i===doc.queue?"YOU":i+1}</div>`).join('')}
        </div>
        <div style="color:${C().dim};font-size:12px">You're <strong style="color:${C().text}">#${doc.queue+1}</strong> · Est. wait: <strong style="color:${doc.ac}">${doc.queue*8} mins</strong></div>
      </div>
      <div style="${cs()};padding:14px;margin-bottom:12px">
        <div style="${S.lbl};margin-bottom:10px">Consultation Mode</div>
        <div style="display:flex;gap:10px">
          ${doc.mode.map(m=>`<button onclick="APP.selMode='${m}';render()" style="${pill(APP.selMode===m)};flex:1;padding:12px;text-align:center">${m==="clinic"?"🏥 In-Clinic":"📹 Video Call"}</button>`).join('')}
        </div>
      </div>
      <div style="${cs()};padding:14px;margin-bottom:12px">
        <div style="${S.lbl};margin-bottom:10px">Available Slots</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${doc.slots.map(sl=>`<button onclick="APP.selSlot='${sl}';render()" style="border:2px solid ${APP.selSlot===sl?doc.ac:C().border};background:${APP.selSlot===sl?doc.ac+'22':'transparent'};color:${APP.selSlot===sl?doc.ac:C().dim};border-radius:10px;padding:9px 14px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">${sl}</button>`).join('')}
        </div>
      </div>
      <button onclick="openMap(${doc.id})" style="${S.btnSm};width:100%;padding:12px;margin-bottom:12px;font-size:13px">📍 View on Map · ${doc.location}</button>
      <div style="${c2s()};padding:14px;margin-bottom:16px">
        ${[["Consultation Fee","₹"+doc.fee],["Platform Fee","FREE ✓"],["GST","Included"]].map(([k,v])=>`<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:${C().dim};font-size:13px">${k}</span><span style="font-weight:700;color:${v==='FREE ✓'?C().primary:C().text};font-size:13px">${v}</span></div>`).join('')}
        <div style="border-top:1px dashed ${C().border};margin-top:8px;padding-top:10px;display:flex;justify-content:space-between"><span style="font-weight:800;color:${C().text}">Total</span><span style="font-family:'Syne',sans-serif;font-weight:900;font-size:22px;color:${C().primary}">₹${doc.fee}</span></div>
      </div>
      <button onclick="confirmBooking()" style="${S.btn};opacity:${APP.selSlot?1:.4}">${APP.selSlot?`✓ Confirm · ${APP.selMode==='video'?'Video':'Clinic'} · ${APP.selSlot}`:"Select a Slot to Continue"}</button>
    </div>
    ${nav(APP.tab)}
  </div>`;}

/* ═══════════════════════════════════════════
   SECOND OPINION
═══════════════════════════════════════════ */
function buildSecondOpinion(){
  const others=sortByDist(DOCTORS.filter(d=>d.specialty===APP.selDoc?.specialty&&d.id!==APP.selDoc?.id));
  return`<div class="app-screen ai">
    <div style="padding:52px 20px 16px;background:${C().surf};border-bottom:1px solid ${C().border}">
      <div onclick="setScreen('booking')" style="color:${C().dim};font-size:13px;font-weight:700;cursor:pointer;margin-bottom:10px">← Back</div>
      <div style="${S.h1};font-size:22px">Second Opinion</div>
      <div style="color:${C().muted};font-size:12px;margin-top:4px">Other ${APP.selDoc?.specialty}s — nearest & best rated first</div>
    </div>
    <div style="padding:14px 18px 100px;overflow-y:auto;max-height:calc(100vh - 175px)">
      ${others.length?others.map((doc,i)=>`<div onclick="goDoc(${doc.id})" style="${cs()};padding:16px;margin-bottom:12px;cursor:pointer;${i===0?'border:1px solid '+C().primary+'55':''}">
        ${i===0?`<div style="background:${C().primary};color:#000;font-size:10px;font-weight:800;padding:3px 10px;border-radius:6px;display:inline-block;margin-bottom:10px">🏆 NEAREST ALTERNATIVE</div>`:''}
        <div style="display:flex;gap:12px;align-items:center">
          <div style="width:52px;height:52px;border-radius:16px;background:${doc.clr};border:1px solid ${doc.ac}44;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:${doc.ac}">${doc.av}</div>
          <div style="flex:1">
            <div style="font-weight:700;color:${C().text}">${doc.name} ${doc.verified?"✅":""}</div>
            <div style="color:${C().muted};font-size:12px">${doc.clinic} · ${getDist(doc)} km</div>
            <div style="display:flex;gap:10px;margin-top:5px">
              <span style="color:#f59e0b;font-weight:700;font-size:12px">⭐ ${doc.rating}</span>
              <span style="color:${C().primary};font-weight:700;font-size:13px">₹${doc.fee}</span>
              <span style="color:${C().gold};font-size:11px;font-weight:700">${getETA(getDist(doc))} min</span>
            </div>
          </div>
          <div style="background:${doc.next==='Today'?isDark()?'#0d3326':'#d0f0e0':'#2a1a00'};color:${doc.next==='Today'?C().primary:C().gold};padding:5px 10px;border-radius:8px;font-size:11px;font-weight:700">${doc.next}</div>
        </div>
      </div>`).join(''):`<div style="text-align:center;padding:60px 20px;color:${C().muted}">No other specialists found nearby.</div>`}
    </div>
    ${nav(APP.tab)}
  </div>`;}

/* ═══════════════════════════════════════════
   REMINDERS
═══════════════════════════════════════════ */
function buildReminders(){
  return`<div class="app-screen ai">
    <div style="padding:52px 20px 18px;background:${C().surf};border-bottom:1px solid ${C().border}">
      <div onclick="setScreen(null)" style="color:${C().dim};font-size:13px;font-weight:700;cursor:pointer;margin-bottom:12px">← Back</div>
      <div style="${S.h1};font-size:24px">🔔 ${L("reminders")}</div>
    </div>
    <div style="padding:14px 18px 90px;overflow-y:auto;max-height:calc(100vh - 175px)">
      ${REMINDERS.map(r=>`<div onclick="APP.reminderOpen=APP.reminderOpen===${r.id}?null:${r.id};render()" style="${cs(urgClr(r.urgency)+'44')};padding:16px;margin-bottom:12px;cursor:pointer">
        <div style="display:flex;gap:12px;align-items:flex-start">
          <div style="width:44px;height:44px;border-radius:14px;background:${urgBg(r.urgency)};display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${r.icon}</div>
          <div style="flex:1">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div><div style="font-weight:700;color:${C().text};font-size:14px">${r.title}</div><div style="color:${C().muted};font-size:11px;margin-top:2px">${r.doctor}</div></div>
              <span style="background:${urgBg(r.urgency)};color:${urgClr(r.urgency)};font-size:10px;font-weight:800;padding:3px 8px;border-radius:6px;text-transform:uppercase">${r.urgency}</span>
            </div>
            <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
              <span style="${S.btnSm};cursor:default;font-size:10px;padding:3px 8px">📅 ${r.due}</span>
            </div>
          </div>
        </div>
        ${APP.reminderOpen===r.id?`<div style="margin-top:12px;padding-top:12px;border-top:1px dashed ${C().border};display:flex;gap:8px">
          <button onclick="event.stopPropagation();showToast('Reminder set ✓')" style="${S.btnSm}">🔔 Set Reminder</button>
          <button onclick="event.stopPropagation();setTab('doctors');APP.screen=null;render()" style="${S.btnSm}">📅 Book Now</button>
        </div>`:''}
      </div>`).join('')}
    </div>
    ${nav(APP.tab)}
  </div>`;}

/* ═══════════════════════════════════════════
   INSURANCE
═══════════════════════════════════════════ */
function buildInsurance(){
  return`<div class="app-screen ai">
    <div style="padding:52px 20px 18px;background:${C().surf};border-bottom:1px solid ${C().border}">
      <div onclick="setScreen(null)" style="color:${C().dim};font-size:13px;font-weight:700;cursor:pointer;margin-bottom:12px">← Back</div>
      <div style="${S.h1};font-size:24px">🛡️ ${L("insurance")}</div>
    </div>
    <div style="padding:14px 18px 90px;overflow-y:auto;max-height:calc(100vh - 175px)">
      <div style="background:${isDark()?'#200d0d':'#fff5f5'};border-radius:20px;padding:18px;margin-bottom:14px;border:1px solid #e05c5c44">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <div><div style="${S.h1};font-size:16px">${INSURANCE.provider}</div><div style="color:#e05c5c;font-size:12px;font-weight:700">${INSURANCE.plan}</div><div style="color:${C().muted};font-size:11px;margin-top:3px">Policy: ${INSURANCE.policyNo}</div></div>
          <div style="${S.btnSm};cursor:default">✓ ACTIVE</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${[["Sum Insured",INSURANCE.sumInsured],["Premium",INSURANCE.premium],["Expiry",INSURANCE.expiry],["Claims Used","3 / year"]].map(([k,v])=>`<div style="${c2s()};border-radius:10px;padding:10px;text-align:center"><div style="color:${C().muted};font-size:10px;font-weight:700;text-transform:uppercase">${k}</div><div style="font-weight:800;color:${C().text};font-size:13px;margin-top:3px">${v}</div></div>`).join('')}
        </div>
      </div>
      <div style="${S.lbl};margin-bottom:10px">Recent Claims</div>
      ${INSURANCE.claims.map(cl=>`<div style="${cs()};padding:14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
        <div><div style="font-weight:700;color:${C().text};font-size:13px">${cl.title}</div><div style="color:${C().muted};font-size:11px">${cl.date}</div></div>
        <div style="text-align:right"><div style="font-weight:800;color:${C().text};font-size:14px">${cl.amount}</div><div style="background:${cl.status==='Settled'?isDark()?'#0d3326':'#d0f0e0':'#2a1a00'};color:${cl.status==='Settled'?C().primary:C().gold};font-size:10px;font-weight:800;padding:2px 8px;border-radius:6px;margin-top:3px">${cl.status}</div></div>
      </div>`).join('')}
      <div style="${S.lbl};margin-bottom:8px">Covered</div>
      <div style="${cs()};padding:14px;margin-bottom:12px">${INSURANCE.covered.map(c=>`<div style="display:flex;gap:8px;margin-bottom:7px"><span style="color:${C().primary}">✓</span><span style="color:${C().text};font-size:13px">${c}</span></div>`).join('')}</div>
      <div style="${S.lbl};margin-bottom:8px">Not Covered</div>
      <div style="${cs()};padding:14px;margin-bottom:14px">${INSURANCE.notCovered.map(c=>`<div style="display:flex;gap:8px;margin-bottom:7px"><span style="color:#e05c5c">✗</span><span style="color:${C().text};font-size:13px">${c}</span></div>`).join('')}</div>
      <button style="${S.btn}">+ File New Claim</button>
    </div>
    ${nav(APP.tab)}
  </div>`;}

/* ═══════════════════════════════════════════
   PROFILE
═══════════════════════════════════════════ */
function buildProfile(){
  const name=APP.loginName||'User';
  return`<div class="ai">
    <div style="padding:52px 20px 18px;background:${isDark()?'linear-gradient(160deg,#0c1812,#0a0a1f)':C().surf}">
      <div style="${S.h1};font-size:26px;margin-bottom:4px">${L("profile")}</div>
    </div>
    <div style="padding:16px 18px 90px;overflow-y:auto;max-height:calc(100vh - 170px)">
      <div style="${c2s()};padding:20px;margin-bottom:16px;display:flex;gap:16px;align-items:center">
        <div style="width:66px;height:66px;border-radius:50%;background:linear-gradient(135deg,#0d3326,#1a7a52);border:2px solid ${C().primary};display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:${C().primary};flex-shrink:0">${name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</div>
        <div>
          <div style="${S.h1};font-size:19px">${name}</div>
          <div style="color:${C().muted};font-size:12px;margin-top:3px">+91 ${APP.loginPhone||'98765 43210'} · Age ${APP.loginAge||19}</div>
          <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
            <span style="background:${isDark()?'#0d3326':'#d0f0e0'};color:${C().primary};font-size:11px;font-weight:700;padding:3px 10px;border-radius:6px">${APP.loginBlood||'B+'} Blood</span>
            <span style="background:${isDark()?'#2d0f0f':'#ffd0d0'};color:#e05c5c;font-size:11px;font-weight:700;padding:3px 10px;border-radius:6px">Penicillin Allergy</span>
          </div>
        </div>
      </div>
      <div style="background:${isDark()?'#2d0f0f':'#ffd0d0'};border-radius:16px;padding:16px;margin-bottom:16px;border:1px solid #e05c5c44">
        <div style="${S.lbl};color:#e05c5c;margin-bottom:10px">📋 ${L("medHistory")}</div>
        ${[{ic:"🫀",t:"Kidney Stones",d:"Treated Jan 2026 · Follow-up Apr 2026"},{ic:"👁️",t:"Eye Weakness (Myopia)",d:"-2.25/-2.50 · Blue-cut glasses"},{ic:"🦵",t:"Knee Fracture (Patella)",d:"Hairline · Physiotherapy ongoing"}].map(h=>`<div style="display:flex;gap:10px;align-items:center;margin-bottom:8px"><div style="width:34px;height:34px;border-radius:10px;background:#e05c5c22;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${h.ic}</div><div><div style="font-weight:700;color:${C().text};font-size:13px">${h.t}</div><div style="color:${C().muted};font-size:11px">${h.d}</div></div></div>`).join('')}
      </div>
      <div style="${S.lbl};margin-bottom:10px">${L("familyHub")}</div>
      ${FAMILY.map(f=>`<div style="${cs()};padding:14px;margin-bottom:10px;display:flex;gap:12px;align-items:center">
        <div style="width:44px;height:44px;border-radius:50%;background:${C().card2};border:1px solid ${C().border};display:flex;align-items:center;justify-content:center;font-weight:800;color:${C().dim};font-size:13px">${f.av}</div>
        <div style="flex:1"><div style="font-weight:700;color:${C().text}">${f.name}</div><div style="color:${C().muted};font-size:12px">${f.rel} · Age ${f.age} · ${f.blood}</div></div>
        <div style="text-align:right"><div style="font-family:'Syne',sans-serif;font-weight:900;font-size:22px;color:${f.score>=85?C().primary:f.score>=70?C().gold:'#e05c5c'}">${f.score}</div><div style="font-size:10px;color:${C().muted}">score</div></div>
      </div>`).join('')}
      <button style="${S.btnO};margin-bottom:14px">+ Add Family Member</button>
      ${[["⚙️ Settings & Language","setScreen('settings')"],["🔔 Reminders","setScreen('reminders')"],["🛡️ Insurance","setScreen('insurance')"],["🔒 Privacy & Security","setScreen('privacy')"],["ℹ️ About Arogya","setScreen('about')"],["🚪 Logout","doLogout()"]].map(([it,act])=>`<div onclick="${act}" style="${cs()};padding:14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;cursor:pointer"><span style="color:${it.includes('Logout')?'#e05c5c':C().dim};font-size:14px">${it}</span><span style="color:${C().muted}">›</span></div>`).join('')}
    </div>
    ${nav('profile')}
  </div>`;}

/* ═══════════════════════════════════════════
   SETTINGS
═══════════════════════════════════════════ */
function buildSettings(){
  return`<div class="app-screen ai">
    <div style="${hdr()}padding:52px 20px 18px">
      <div onclick="setScreen(null)" style="color:${C().dim};font-size:13px;font-weight:700;cursor:pointer;margin-bottom:12px">← Back</div>
      <div style="${S.h1};font-size:26px">Settings ⚙️</div>
    </div>
    <div style="padding:18px 18px 90px">
      <div style="${S.lbl};margin-bottom:10px">${L("theme")}</div>
      <div style="display:flex;gap:10px;margin-bottom:22px">
        <button onclick="THEME='dark';document.body.className='dark';render()" style="${pill(isDark())};padding:10px 18px;flex:1;text-align:center">🌙 ${L("darkMode")}</button>
        <button onclick="THEME='light';document.body.className='light';render()" style="${pill(!isDark())};padding:10px 18px;flex:1;text-align:center">☀️ ${L("lightMode")}</button>
      </div>
      <div style="${S.lbl};margin-bottom:10px">${L("languages")}</div>
      <div style="display:flex;gap:10px;margin-bottom:22px">
        <button onclick="LANG='en';render()" style="${pill(LANG==='en')};padding:10px 18px;flex:1;text-align:center">🇬🇧 English</button>
        <button onclick="LANG='hi';render()" style="${pill(LANG==='hi')};padding:10px 18px;flex:1;text-align:center">🇮🇳 हिंदी</button>
      </div>
      <div style="${S.lbl};margin-bottom:10px">Sort Preference</div>
      <div style="display:flex;gap:8px;margin-bottom:22px;flex-wrap:wrap">
        ${[{k:'distance',l:'📍 Nearest'},{k:'rating',l:'⭐ Best Rated'},{k:'fee',l:'💰 Cheapest'}].map(o=>`<button onclick="APP.sortMode='${o.k}';render()" style="${pill(APP.sortMode===o.k)};padding:8px 14px;font-size:12px">${o.l}</button>`).join('')}
      </div>
    </div>
    ${nav(APP.tab)}
  </div>`;}

/* ═══════════════════════════════════════════
   PRIVACY
═══════════════════════════════════════════ */
function buildPrivacy(){
  const principles=[
    {ic:"🔑",t:"Zero-Knowledge Architecture",d:"All Health Vault records are AES-256 encrypted on your device before storage. Your PIN is hashed locally — never transmitted to any server.",col:"#a78bfa"},
    {ic:"🚫",t:"We Never Sell Your Data",d:"Arogya does not sell, rent or share your personal health data with insurance companies, advertisers or any third party under any circumstances.",col:"#e05c5c"},
    {ic:"📵",t:"100% Ad-Free",d:"No advertisements. No paid doctor placements. Doctor recommendations are ranked purely by distance, ratings and availability.",col:"#f0b429"},
    {ic:"⏱️",t:"Time-Limited Sharing",d:"Records shared with doctors expire automatically after 2, 6 or 24 hours. Access can be revoked with a single tap at any moment.",col:"#34d399"},
    {ic:"🔐",t:"End-to-End Encryption",d:"All data in transit uses TLS 1.3. Data at rest uses AES-256-GCM. The server stores only encrypted ciphertext it cannot decode.",col:"#60a5fa"},
    {ic:"🇮🇳",t:"DPDP Act 2023 Compliant",d:"Fully compliant with India's Digital Personal Data Protection Act 2023. You may exercise all rights including access, correction and deletion.",col:"#a78bfa"},
  ];
  return`<div class="app-screen ai">
    <div style="background:${isDark()?'linear-gradient(160deg,#0d0a2e,#1a0a38)':C().surf};padding:52px 20px 20px;border-bottom:1px solid ${C().border}">
      <div onclick="setScreen(null)" style="color:${C().dim};font-size:13px;font-weight:700;cursor:pointer;margin-bottom:12px">← Back</div>
      <div style="${S.h1};font-size:24px">🛡️ ${L("privacy")}</div>
      <div style="color:#a78bfa;font-size:12px;font-weight:700;margin-top:4px">Your data. Your rules. Always encrypted.</div>
    </div>
    <div style="padding:16px 18px 90px;overflow-y:auto;max-height:calc(100vh - 186px)">
      ${principles.map(p=>`<div style="${cs()};padding:16px;margin-bottom:10px;border-left:3px solid ${p.col}">
        <div style="display:flex;gap:10px;align-items:flex-start">
          <div style="width:36px;height:36px;border-radius:10px;background:${p.col}22;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${p.ic}</div>
          <div><div style="font-weight:800;color:${C().text};font-size:13px;margin-bottom:4px">${p.t}</div><div style="color:${C().muted};font-size:12px;line-height:1.7">${p.d}</div></div>
        </div>
      </div>`).join('')}
      <div style="border:1px dashed ${C().border};border-radius:12px;padding:14px;text-align:center;margin-top:8px">
        <div style="color:${C().muted};font-size:11px;line-height:1.8">Questions? <span style="color:${C().primary};font-weight:700">privacy@arogya.health</span></div>
      </div>
    </div>
    ${nav(APP.tab)}
  </div>`;}



/* ═══════════════════════════════════════════
   ABOUT — Vidit Maheshwari + team
═══════════════════════════════════════════ */
function buildAbout(){
  return`<div class="app-screen ai">
    <div style="background:${isDark()?'linear-gradient(160deg,#0c1812,#0d2e1e)':C().surf};padding:52px 20px 22px;border-bottom:1px solid ${C().border}">
      <div onclick="setScreen(null)" style="color:${C().dim};font-size:13px;font-weight:700;cursor:pointer;margin-bottom:14px">← Back</div>
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px">
        <div style="width:60px;height:60px;border-radius:18px;background:linear-gradient(135deg,#0d3326,#1a7a52);border:2px solid ${C().primary};display:flex;align-items:center;justify-content:center"><span style="font-family:'Syne',sans-serif;font-size:20px;font-weight:900;color:${C().primary}">Ar</span></div>
        <div><div style="${S.h1};font-size:28px">Arogya</div><div style="color:${C().primary};font-size:11px;font-weight:700;letter-spacing:2px">HEALTH · आरोग्य</div></div>
      </div>
      <div style="color:${C().muted};font-size:13px;line-height:1.7">India's most intelligent personal health companion — bringing quality healthcare to every pocket.</div>
    </div>
    <div style="padding:16px 18px 90px;overflow-y:auto;max-height:calc(100vh - 210px)">
      <!-- Mission -->
      <div style="${c2s()};padding:18px;margin-bottom:16px;border:1px solid ${C().primary}33">
        <div style="${S.h1};font-size:15px;margin-bottom:10px">🌱 Our Mission</div>
        <div style="color:${C().text};font-size:13px;line-height:1.8">Arogya (Sanskrit: आरोग्य — meaning health and freedom from disease) was built to democratise healthcare in India. We believe quality medical guidance, affordable medicines, and secure health records should be accessible to every Indian — from New Delhi to remote villages.</div>
      </div>
      <!-- Features -->
      <div style="${S.lbl};margin-bottom:12px">What Arogya Offers</div>
      ${[{ic:"🤖",t:"AI Symptom Analysis",d:"Routes you to the exact right specialist across 200+ conditions."},{ic:"🩺",t:"Verified Specialists",d:"Credential-verified doctors sorted by distance, rating or fee."},{ic:"💊",t:"Medicine Intelligence",d:"Compare branded vs generic prices. Order online or reserve pickup."},{ic:"🔐",t:"Zero-Knowledge Vault",d:"AES-256 encrypted records. Only you can decrypt them."},{ic:"📍",t:"Live Map & Routing",d:"Interactive map with real-time ETA, live tracking and emergency hospitals."},{ic:"🆘",t:"Emergency Ready",d:"Nearest hospitals with call buttons. First aid for 5 critical conditions."}].map(it=>`<div style="${cs()};padding:16px;margin-bottom:10px">
        <div style="display:flex;gap:12px;align-items:flex-start">
          <div style="width:40px;height:40px;border-radius:12px;background:${isDark()?'#0d3326':'#d0f0e0'};display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${it.ic}</div>
          <div><div style="font-weight:800;color:${C().text};font-size:13px;margin-bottom:4px">${it.t}</div><div style="color:${C().muted};font-size:12px;line-height:1.7">${it.d}</div></div>
        </div>
      </div>`).join('')}
      <!-- Team -->
      <div style="${S.lbl};margin:18px 0 12px">Built By</div>
      <div style="${c2s()};padding:18px;margin-bottom:16px;border:1px solid ${C().primary}33">
        <div style="margin-bottom:12px">
          <div style="font-weight:900;color:${C().text};font-size:16px;font-family:'Syne',sans-serif">Vidit Maheshwari</div>
          <div style="color:${C().primary};font-size:13px;font-weight:700;margin-top:3px">Lead Developer · Product Designer</div>
          <div style="color:${C().muted};font-size:12px;margin-top:2px">With the dedicated support of:</div>
        </div>
        ${[{name:"Om",role:"Frontend & UX Collaboration"},{name:"Rudransh",role:"Research & Data Architecture"},{name:"Avneesh",role:"Testing, Feedback & QA"}].map(m=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div style="width:36px;height:36px;border-radius:50%;background:${isDark()?'#0d3326':'#d0f0e0'};border:1px solid ${C().primary}44;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:${C().primary}">${m.name[0]}</div>
          <div><div style="font-weight:700;color:${C().text};font-size:14px">${m.name}</div><div style="color:${C().muted};font-size:11px">${m.role}</div></div>
        </div>`).join('')}
      </div>
      <!-- Tech -->
      <div style="${S.lbl};margin-bottom:10px">Technology</div>
      <div style="${cs()};padding:16px;margin-bottom:16px">
        ${[["🤖","AI Engine","Claude Sonnet — Anthropic"],["🔒","Encryption","AES-256 + Zero-knowledge"],["📍","Location","Haversine distance · GPS simulation"],["🇮🇳","Platform","Built for Indian healthcare"]].map(([ic,k,v])=>`<div style="display:flex;gap:10px;align-items:center;margin-bottom:10px"><span style="font-size:18px">${ic}</span><div><div style="font-weight:700;color:${C().text};font-size:12px">${k}</div><div style="color:${C().muted};font-size:11px">${v}</div></div></div>`).join('')}
      </div>
      <div style="background:${isDark()?'#0d0a2e':'#f0eeff'};border-radius:14px;padding:14px;margin-bottom:14px;border:1px solid #a78bfa33;text-align:center">
        <div style="font-size:12px;color:#a78bfa;line-height:1.9"><strong>Version 2.0 · April 2026</strong><br>Built with ❤️ for India 🇮🇳<br>Powered by Anthropic Claude AI</div>
      </div>
      <div style="color:${C().muted};font-size:11px;text-align:center;line-height:1.7;padding:10px;border:1px dashed ${C().border};border-radius:10px">Arogya provides health information and AI guidance only. It is not a substitute for professional medical diagnosis or treatment.</div>
    </div>
    ${nav(APP.tab)}
  </div>`;}

/* ═══════════════════════════════════════════
   ACTION HANDLERS
═══════════════════════════════════════════ */
window.setTab=t=>{APP.tab=t;APP.screen=null;APP.search="";APP.showSortSidebar=false;window.scrollTo(0,0);render();}
window.setScreen=s=>{APP.screen=s;APP.showSortSidebar=false;window.scrollTo(0,0);render();}
window.goDoc=id=>{const d=DOCTORS.find(x=>x.id===id);if(d){APP.selDoc=d;APP.selSlot=null;APP.booked=false;APP.screen="booking";render();}}
window.openMap=id=>{APP.mapDoc=id?DOCTORS.find(x=>x.id===id)||null:null;APP.screen="map";APP.mapMode='clinics';render();}
window.setFamIdx=i=>{APP.famIdx=i;render();}
window.gotoSpecialty=sp=>{APP.specFilter=sp;APP.tab="doctors";APP.screen=null;APP.showSortSidebar=false;render();}
window.setSymInput=v=>{APP.symInput=v;const inp=document.getElementById('symInput');if(inp)inp.value=v;APP.symRes=null;render();}
window.setMedInput=v=>{APP.medInput=v;const inp=document.getElementById('medInput');if(inp)inp.value=v;APP.medRes=null;APP.medTab='branded';checkMed();}
window.openMedOrder=key=>{
  const data=MEDICINES_DB[key];
  if(!data){showToast('Searching prices for '+key+'...');setScreen('ai-medicine');APP.medInput=key;checkMed();return;}
  APP.medInput=key;APP.medRes=data;APP.medTab='branded';setScreen('ai-medicine');
};

window.syncDigiLockerFiles = async (token) => {
  try {
    const response = await fetch('http://127.0.0.1:8000/auth/api/vault/sync-digilocker/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dl_token: token })
    });

    if (response.ok) {
      const data = await response.json();
      
      // Prevent duplicating records if they are already in the vault
      const existingIds = APP.records.map(r => r.id);
      const newDocs = data.documents.filter(r => !existingIds.includes(r.id));
      
      // Add the official government docs to the top of the vault
      APP.records = [...newDocs, ...APP.records];
      
      showToast("DigiLocker synced successfully! 🇮🇳");
    } else {
      showToast("Failed to fetch DigiLocker records.");
    }
  } catch (err) {
    console.error("DigiLocker Sync failed:", err);
    showToast("Network error while syncing DigiLocker.");
  }
  
  // Turn off the spinner and refresh the UI
  APP.vaultLoading = false;
  render();
};

window.saveRecordToDigiLocker = async () => {
  const title = document.getElementById('vaultDocTitle')?.value.trim();
  const docType = document.getElementById('vaultDocType')?.value;
  const issuer = document.getElementById('vaultDocIssuer')?.value.trim() || "Self Uploaded via Vault";

  if (!title) {
    showToast("Please enter a document title.");
    return;
  }

  try {
    const res = await fetch('http://127.0.0.1:8000/auth/mock-api/public/oauth2/1/files/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title,
        type: docType,
        doctor_name: issuer,
        note: `Securely uploaded by user into personal health repository.`
      })
    });

    const data = await res.json();
    if (res.ok) {
      showToast("Record uploaded to DigiLocker Database ✓");
      APP.showAddModal = false;
      
      // Auto-trigger a sync so the newly created SQL record shows immediately in the Vault
      if (typeof syncDigiLockerFiles === 'function') {
        const activeToken = localStorage.getItem('dl_token') || "token_active_session";
        syncDigiLockerFiles(activeToken);
      } else {
        render();
      }
    } else {
      showToast(data.error || "Upload failed");
    }
  } catch (err) {
    console.error("Upload error:", err);
    showToast("Server connection error during upload.");
  }
};

window.openAddModal = () => {
  console.log("Opening modal..."); // Debugging log
  APP.showAddModal = true;
  render();
};

window.closeAddModal = () => {
  APP.showAddModal = false;
  render();
};

window.confirmBooking=()=>{
  if(!APP.selSlot)return;
  APP.booked=true;APP.qTimer=APP.selDoc.queue*8;render();
  if(APP.qInterval)clearInterval(APP.qInterval);
  APP.qInterval=setInterval(()=>{if(APP.qTimer>0){APP.qTimer--;const el=document.getElementById('qTimerDisp');if(el)el.innerHTML=APP.qTimer+' <span style="font-size:14px;color:'+C().muted+'">mins</span>';}else clearInterval(APP.qInterval);},4000);
};
window.pinDigit=(i,val)=>{
  APP.vaultPinVal[i]=val;APP.vaultPin=APP.vaultPinVal.join('');APP.pinErr=false;
  const el=document.getElementById('pin'+i);if(el){el.classList.toggle('filled',!!val);el.classList.remove('err');}
  if(val&&i<3){const n=document.getElementById('pin'+(i+1));if(n)n.focus();}
  if(APP.vaultPin.length===4)setTimeout(()=>unlockVault(),120);
};
window.pinKeydown=(e,i)=>{
  if(e.key==="Backspace"){APP.vaultPinVal[i]="";APP.vaultPin=APP.vaultPinVal.join('');const el=document.getElementById('pin'+i);if(el){el.value="";el.classList.remove('filled');}if(i>0){const p=document.getElementById('pin'+(i-1));if(p)p.focus();}render();}
};
window.unlockVault=()=>{if(APP.vaultPin==="1234"){APP.vaultOpen=true;APP.pinErr=false;APP.vaultPinVal=["","","",""];}else{APP.pinErr=true;APP.vaultPinVal=["","","",""];APP.vaultPin="";}render();}
window.lockVault=()=>{APP.vaultOpen=false;APP.vaultPin="";APP.vaultPinVal=["","","",""];APP.pinErr=false;render();}
window.toggleShare=(id,hrs)=>{APP.records=APP.records.map(r=>r.id===id?{...r,shared:!r.shared,sharedUntil:!r.shared?hrs+'h':null}:r);render();}
// Replace this function in app.js
// In app.js: Update window.checkSym with full console logs
window.checkSym = async () => {
  console.log("1. checkSym triggered");

  const inp = document.getElementById('symInput');
  if (inp) {
    APP.symInput = inp.value;
  }
  
  console.log("2. symInput value:", APP.symInput);

  if (!APP.symInput || APP.symInput.trim() === "") {
    alert("Please enter symptoms before analyzing.");
    return;
  }

  // Set loading state in UI
  APP.symRes = {
    specialist: "AI Agent Analyzing...",
    urgency: "medium",
    advice: "Running diagnostic reasoning via Gemini. Please wait..."
  };
  render();

  const fullPhone = APP.loginPhone ? '+91' + APP.loginPhone : '';
  const url = 'http://127.0.0.1:8000/auth/api/agent/symptoms/';

  try {
    console.log("3. Fetching:", url);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: APP.symInput,
        phone: fullPhone
      })
    });

    console.log("4. Response status:", response.status);
    const data = await response.json();
    console.log("5. Received data:", data);

    if (response.ok) {
      APP.symRes = data;
    } else {
      APP.symRes = {
        specialist: "Error",
        urgency: "medium",
        advice: data.error || "Server returned an error."
      };
    }
  } catch (error) {
    console.error("Fetch crashed:", error);
    APP.symRes = {
      specialist: "Network Error",
      urgency: "medium",
      advice: "Could not reach the Django backend at " + url
    };
  }

  render();
};
window.connectDigiLocker = () => {
  const clientId = 'arogya_test_client';
  const redirectUri = 'http://127.0.0.1:8000/auth/api/digilocker/callback/';
  
  const url = `http://127.0.0.1:8000/auth/mock-api/public/oauth2/1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=123`;
  
  window.location.href = url;
};

window.checkMed = async () => {
  const inp = document.getElementById('medInput');
  if (inp) APP.medInput = inp.value;
  
  if (!APP.medInput || APP.medInput.trim() === "") {
    showToast("Please enter a medicine name.");
    return;
  }

  // 1. Show loading state to confirm the button was clicked
  showToast("AI is searching pharmacies...");

  try {
    // 2. Call your new Django API
    const response = await fetch('http://127.0.0.1:8000/auth/api/agent/medicine/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: APP.medInput })
    });

    const data = await response.json();

    if (response.ok) {
      const results = Array.isArray(data.results) ? data.results : [];
      if (results.length === 0) {
        showToast("No medicines found for that spelling.");
        APP.medRes = null;
      } else {
        APP.medRes = {
          purpose: data.purpose,
          usage: data.usage,
          doses: data.doses,
          savings: data.savings,
          branded: results.filter(result => result.price > 15),
          generic: results.filter(result => result.price <= 15)
        };
      }
      APP.medTab = 'branded'; // Default tab
    } else {
      showToast(data.error || "Failed to fetch medicines.");
      APP.medRes = null;
    }
  } catch (error) {
    console.error("Medicine fetch crashed:", error);
    showToast("Network error while searching for medicines.");
    APP.medRes = null;
  }
  
  // 4. Update the screen
  render();
};

window.toggleLiveTracking=()=>{
  if(LT.active){clearInterval(LT.interval);LT.active=false;LT.step=0;LT.userLat=28.6139;LT.userLng=77.2090;showToast('Live tracking stopped');}
  else{LT.active=true;LT.targetDoc=APP.mapDoc||sortByDist(DOCTORS)[0];showToast('📡 Live tracking started');
    LT.interval=setInterval(()=>{const td=LT.targetDoc;LT.userLat+=(td.lat-LT.userLat)*0.09;LT.userLng+=(td.lng-LT.userLng)*0.09;LT.step++;
      const newDist=getDist(td);const etaEl=document.getElementById('liveETA');const distEl=document.getElementById('liveDist');
      if(etaEl)etaEl.textContent=getETA(newDist)+' min';if(distEl)distEl.textContent=newDist+' km';
      if(LT.step>=12||parseFloat(newDist)<0.25){clearInterval(LT.interval);LT.active=false;LT.step=0;showToast('🏥 Arrived at '+td.clinic+'!');render();}
    },1800);}
  render();
};
window.generateAISummary = async () => {
  APP.aiLoading = true;
  APP.aiSummary = null;
  APP.aiError = null;
  render();

  try {
    const phone = getSignedInPhone();
    if (!phone) {
      throw new Error('Your signed-in phone number is unavailable. Please log in again.');
    }

    const response = await fetch('http://127.0.0.1:8000/auth/api/agent/summary/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({phone})
    });

    const data = await response.json();

    if (response.ok) {
      APP.aiSummary = data.summary;
    } else {
      APP.aiError = data.error || "Server returned an error.";
    }
  } catch (error) {
    console.error("Fetch crashed:", error);
    APP.aiError = "Network error. Could not reach AI server.";
  }

  // 4. Clear loading state and render the final AI output
  APP.aiLoading = false;
  render();
};
window.copyAISummary=()=>{if(!APP.aiSummary)return;if(navigator.clipboard)navigator.clipboard.writeText(APP.aiSummary).then(()=>showToast('Summary copied ✓')).catch(()=>{});else showToast('Select and copy the text manually');}

window.sendOTP = async () => {
  if (APP.loginPhone.length !== 10) {
    showToast('Enter valid 10-digit number');
    return;
  }
  
  // Create the full number variable
  const fullPhoneNumber = '+91' + APP.loginPhone;
  localStorage.removeItem('arogya_manual_logout');
  
  try {
    const response = await fetch('http://127.0.0.1:8000/auth/api/send-otp/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Send the full number
      body: JSON.stringify({ phone: fullPhoneNumber, create_account: APP.isNewUser }) 
    });

    if (response.ok) {
      APP.loginOtpSent = true;
      APP.loginStep = 3;
      APP.loginOtp = "";
      render();
      setTimeout(() => document.getElementById('otp0')?.focus(), 200);
      showToast('OTP Sent Successfully!');
    } else {
      const data = await response.json().catch(() => ({}));
      APP.loginStep = 1;
      APP.loginPhone = '';
      APP.loginOtp = '';
      APP.isNewUser = false;
      render();
      showToast(data.error || 'No account found. Please create an account first.');
    }
  } catch (error) {
    showToast('Network error. Check your connection.');
  }
};

window.otpDigit=(i,val)=>{const arr=(APP.loginOtp||'').split('');arr[i]=val;APP.loginOtp=arr.join('').slice(0,6);if(val&&i<5){const n=document.getElementById('otp'+(i+1));if(n)n.focus();}};
window.otpKey=(e,i)=>{if(e.key==="Backspace"){const arr=(APP.loginOtp||'').split('');arr[i]='';APP.loginOtp=arr.join('');const el=document.getElementById('otp'+i);if(el)el.value='';if(i>0){const p=document.getElementById('otp'+(i-1));if(p)p.focus();}}};

window.verifyOTP = async () => {
  const otpInput = document.getElementById('otpSingleInput');
  const phone = APP.loginPhone ? '+91' + APP.loginPhone : '';
  const otp = (otpInput?.value || APP.loginOtp || '').replace(/\D/g, '');

  if (!phone || phone.length !== 13) {
    showToast('Enter a valid 10-digit mobile number');
    return;
  }

  if (otp.length !== 6) {
    showToast('Enter all 6 OTP digits');
    return;
  }

  APP.loginOtp = otp;
    
    try {
        const res = await fetch('http://127.0.0.1:8000/auth/api/verify-otp/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phone, otp: otp })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            // Save the tokens in the browser's local storage
            localStorage.setItem('arogya_access', data.access_token);
            localStorage.setItem('arogya_refresh', data.refresh_token);
            localStorage.setItem('arogya_user_phone', data.phone);
            localStorage.setItem('arogya_session_started', String(Date.now()));
            localStorage.setItem('arogya_profile', JSON.stringify(data.profile || {}));
            
            APP.profileDetails = data.profile || null;
            APP.loginName = data.profile?.name || '';
            APP.loginAge = data.profile?.age || '';
            APP.loginBlood = data.profile?.blood_group || '';
            if (data.needs_onboarding) {
              APP.loggedIn = false;
              APP.loginStep = 4;
              APP.onboardingError = '';
            } else {
              APP.loggedIn = true;
              APP.tab = 'home';
              showToast("Login successful!");
            }
            render();
        } else {
            showToast(data.error || "Invalid OTP");
        }
    } catch (err) {
        showToast("Network error during login.");
    }
};

window.checkExistingSession = () => {
    const accessToken = localStorage.getItem('arogya_access');
    const userPhone = localStorage.getItem('arogya_user_phone');
  const sessionStarted = Number(localStorage.getItem('arogya_session_started'));
  const manuallyLoggedOut = localStorage.getItem('arogya_manual_logout') === 'true';
  const storedProfile = localStorage.getItem('arogya_profile');
  const sessionIsValid = sessionStarted > 0 && Date.now() - sessionStarted < 60 * 60 * 1000;
    
  if (accessToken && userPhone && storedProfile && sessionIsValid && !manuallyLoggedOut) {
    console.log("Active session found for", userPhone);
    APP.loginPhone = userPhone.replace(/^\+91/, '');
    try {
      applyProfileDetails(JSON.parse(storedProfile), false);
    } catch (error) {
      clearStoredSession();
    }
    } else {
    clearStoredSession();
    }
  if (!APP.loggedIn) render();
};

function clearStoredSession() {
  localStorage.removeItem('arogya_access');
  localStorage.removeItem('arogya_refresh');
  localStorage.removeItem('arogya_user_phone');
  localStorage.removeItem('arogya_session_started');
  localStorage.removeItem('arogya_profile');
  APP.loggedIn = false;
  APP.tab = 'home';
  APP.loginStep = 1;
}

// Run the check as soon as the script loads
checkExistingSession(); 

window.logoutUser = () => {
  localStorage.setItem('arogya_manual_logout', 'true');
  clearStoredSession();
  showToast("Logged out successfully");
  render();
};

function applyProfileDetails(profile, showWelcome = true) {
  APP.profileDetails = profile;
  APP.loginName = profile.name || APP.loginName;
  APP.loginAge = profile.age || APP.loginAge;
  APP.loginBlood = profile.blood_group || APP.loginBlood;
  FAMILY[0].name = APP.loginName || FAMILY[0].name;
  FAMILY[0].age = parseInt(APP.loginAge, 10) || FAMILY[0].age;
  FAMILY[0].blood = APP.loginBlood || FAMILY[0].blood;
  APP.loginStep = 1;
  APP.tab = 'home';
  APP.loggedIn = true;
  APP.onboardingLoading = false;
  APP.onboardingError = '';
  localStorage.setItem('arogya_profile', JSON.stringify(profile));
  localStorage.setItem('arogya_session_started', localStorage.getItem('arogya_session_started') || String(Date.now()));
  render();
  if (showWelcome) showToast('Welcome to Arogya, ' + APP.loginName + '!');
}

window.uploadABHA = async file => {
  if (!file) return;
  APP.onboardingLoading = true;
  APP.onboardingError = '';
  render();
  const body = new FormData();
  body.append('phone', '+91' + APP.loginPhone);
  body.append('file', file);
  try {
    const response = await fetch('/auth/api/onboarding/upload-abha/', {method: 'POST', body});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'ABHA upload failed');
    applyProfileDetails(data.profile);
  } catch (error) {
    APP.onboardingLoading = false;
    APP.onboardingError = error.message;
    render();
  }
};

window.linkDigiLocker = async () => {
  APP.onboardingLoading = true;
  APP.onboardingError = '';
  render();
  try {
    const response = await fetch('/auth/api/onboarding/link-digilocker/', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({phone: '+91' + APP.loginPhone})
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to link DigiLocker');
    applyProfileDetails(data.profile);
  } catch (error) {
    APP.onboardingLoading = false;
    APP.onboardingError = error.message;
    render();
  }
};

window.completeProfile=()=>{applyProfileDetails({name:APP.loginName,age:APP.loginAge,blood_group:APP.loginBlood});}
window.doLogout=()=>{localStorage.setItem('arogya_manual_logout','true');clearStoredSession();APP.loginPhone="";APP.loginOtp="";APP.vaultOpen=false;APP.vaultPin="";APP.vaultPinVal=["","","",""];APP.aiSummary=null;APP.aiError=null;APP.screen=null;render();}
window.showToast=msg=>{let t=document.getElementById('_toast');if(!t){t=document.createElement('div');t.id='_toast';document.body.appendChild(t);}t.style.cssText=`position:fixed;bottom:96px;left:50%;transform:translateX(-50%);background:${isDark()?'#0d3326':'#d0f0e0'};color:${C().primary};padding:12px 20px;border-radius:12px;font-size:13px;font-weight:700;z-index:9999;border:1px solid ${C().primary}44;max-width:340px;text-align:center;opacity:1;transition:opacity .3s;pointer-events:none`;t.textContent=msg;clearTimeout(t._t);t._t=setTimeout(()=>{t.style.opacity='0';},3500);}

// --- URL TOKEN CATCHER ---
// Run this check immediately when the script loads
const urlParams = new URLSearchParams(window.location.search);
const dlToken = urlParams.get('dl_token');

if (dlToken) {
  console.log("Caught DigiLocker Token!", dlToken);
  
  // 1. Bypass the login screen since they just returned from Auth
  APP.loggedIn = true;
  APP.loginName = APP.loginName || "User";
  
  // 2. Open the Vault immediately
  APP.tab = "vault";
  APP.vaultOpen = true;
  APP.vaultLoading = true;
  
  // 3. Clean the token out of the URL address bar for security
  window.history.replaceState({}, document.title, window.location.pathname);
  
  // 4. Trigger the fetch to get the PDFs
  syncDigiLockerFiles(dlToken);
}

render();
