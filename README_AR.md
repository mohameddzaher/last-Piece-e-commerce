# ✨ Last Piece - منصة التسوق الفريدة

> اكتشف وشتري أشياء فريدة لا توجد في مكان آخر

---

## 🎯 حول المشروع

Last Piece هي منصة تجارة إلكترونية متقدمة متخصصة في بيع **القطع الفريدة والمميزة** من حول العالم. كل منتج موجود مرة واحدة فقط!

### الميزات الرئيسية:
- 🛍️ **كتالوج منتجات عصري** - واجهة احترافية وسهلة الاستخدام
- 🛒 **سلة تسوق ذكية** - مع حفظ البيانات
- ❤️ **قائمة المفضلة** - احفظ المنتجات المفضلة لديك
- 👤 **حسابات المستخدمين** - تسجيل دخول آمن وإدارة الملف الشخصي
- 💳 **نظام دفع آمن** - معالجة آمنة للطلبات
- 📱 **تطبيق متجاوب** - يعمل على جميع الأجهزة
- 🌙 **Dark Mode** - وضع ليلي مريح
- 🎨 **تصميم حديث** - واجهة جميلة وتفاعلية

---

## 🏗️ البنية التقنية

### Frontend
```
Next.js 14 → React 18 → Tailwind CSS 3
+ Framer Motion (Animations)
+ Zustand (State Management)
+ Axios (HTTP Client)
```

### Backend
```
Express.js 4 → Node.js 20
+ MongoDB Atlas (Database)
+ JWT (Authentication)
+ Cors (Cross-Origin)
```

### Database
```
MongoDB Atlas (Cloud)
- Products Collection
- Users Collection
- Orders Collection
- Cart Collection
- Wishlist Collection
```

---

## 🚀 البدء السريع

### المتطلبات المسبقة
- ✅ Node.js v20 أو أحدث
- ✅ npm أو yarn
- ✅ MongoDB Atlas account (اختياري - مُعد بالفعل)

### خطوات التثبيت

1. **استنساخ المشروع** (إذا لزم الأمر)
```bash
git clone <repository-url>
cd last-piece
```

2. **تثبيت المكتبات**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **ضبط متغيرات البيئة**

**Backend** - `backend/.env`
```env
MONGODB_URI=mongodb+srv://energizetechsolutions_db_user:vAkzzk02DtuymE50@lastpiece.x0kqkhx.mongodb.net/?appName=lastPiece
PORT=5001
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

**Frontend** - `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

---

## 🎯 تشغيل المشروع

### الطريقة 1: في نافذتي طرفية منفصلة

**النافذة 1 - Backend:**
```bash
cd /Users/mohamedzaher/Desktop/last-piece/backend
npm run dev
```
✅ سيعمل على `http://localhost:5001`

**النافذة 2 - Frontend:**
```bash
cd /Users/mohamedzاher/Desktop/last-piece/frontend
npm run dev
```
✅ سيعمل على `http://localhost:3000`

### الطريقة 2: استخدام الأوامر السريعة

من المجلد الرئيسي:
```bash
# تشغيل Backend فقط
npm run dev:backend

# تشغيل Frontend فقط
npm run dev:frontend

# أو استخدم البرنامج النصي
bash START.sh
```

### الطريقة 3: في نفس النافذة (باستخدام tmux أو screen)
```bash
# إذا كان لديك tmux
tmux new-session -d -s backend 'cd backend && npm run dev'
tmux new-session -d -s frontend 'cd frontend && npm run dev'
```

---

## 📱 الوصول إلى التطبيق

بمجرد تشغيل كلا الخادم:

```
🌐 Frontend:  http://localhost:3000
🔌 Backend:   http://localhost:5001
📊 API:       http://localhost:5001/api
```

### اختبار الاتصال:
```bash
# تحقق من أن Backend يعمل
curl http://localhost:5001/

# يجب أن تحصل على:
# {"success": true, "message": "Last Piece API Server", ...}
```

---

## 🗂️ هيكل المشروع

```
last-piece/
├── backend/
│   ├── src/
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth & validation
│   │   ├── controllers/     # Business logic
│   │   └── server.js        # Main server file
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── pages/           # Next.js pages
│   │   ├── components/      # React components
│   │   ├── store/           # Zustand stores
│   │   ├── utils/           # Helper functions
│   │   ├── styles/          # CSS files
│   │   └── hooks/           # Custom hooks
│   ├── public/              # Static assets
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env.local
│
├── docs/                    # Documentation
├── README.md
├── DESIGN_UPDATE.md
└── package.json (root)
```

---

## 📚 المسارات الرئيسية

### Frontend Routes
```
/                    → الصفحة الرئيسية
/products            → قائمة المنتجات
/products/:id        → تفاصيل المنتج
/cart                → سلة التسوق
/wishlist            → قائمة المفضلة
/checkout            → الخروج والدفع
/login               → تسجيل الدخول
/register            → إنشاء حساب
/dashboard           → لوحة التحكم
/about               → معلومات عنا
/contact             → اتصل بنا
```

### Backend API Routes
```
POST   /api/auth/login           → تسجيل الدخول
POST   /api/auth/register        → إنشاء حساب
GET    /api/products             → جميع المنتجات
GET    /api/products/:id         → تفاصيل المنتج
POST   /api/cart                 → إضافة للسلة
GET    /api/cart                 → عرض السلة
POST   /api/orders               → إنشاء طلب
GET    /api/orders               → طلباتي
POST   /api/wishlist             → إضافة للمفضلة
GET    /api/wishlist             → المفضلة
```

---

## 🔐 المصادقة والأمان

### نظام تسجيل الدخول:
1. المستخدم يدخل البيانات
2. Backend يتحقق ويُصدر JWT token
3. Frontend يحفظ التوكن في localStorage
4. جميع الطلبات اللاحقة تشمل التوكن

### Endpoints محمية:
```
🔒 GET    /api/cart
🔒 POST   /api/cart
🔒 GET    /api/orders
🔒 POST   /api/orders
🔒 GET    /api/wishlist
🔒 POST   /api/wishlist
```

---

## 🎨 التصميم والواجهة

### نظام الألوان:
```
Primary:   #1e293b (Slate 900)
Accent:    #3b82f6 (Blue 500)
Secondary: #64748b (Slate 600)
Success:   #10b981 (Emerald 600)
Warning:   #f59e0b (Amber 500)
Error:     #ef4444 (Red 500)
```

### المكونات الرئيسية:
- Header (Logo, Navigation, Icons)
- Footer (Links, Socials, Contact)
- ProductCard (Image, Rating, Price, Actions)
- Layout (Header + Content + Footer)
- Animations (Framer Motion)

---

## 🛠️ الأوامر المتاحة

### Backend
```bash
npm run dev          # تشغيل مع hot reload
npm start            # تشغيل الإنتاج
npm run test         # اختبارات
npm run lint         # فحص الأخطاء
```

### Frontend
```bash
npm run dev          # تشغيل مع hot reload
npm run build        # بناء للإنتاج
npm start            # تشغيل من البناء
npm run lint         # فحص الأخطاء
npm run test         # اختبارات
```

---

## 🐛 حل المشاكل الشائعة

### ❌ خطأ: Port Already in Use
```bash
# قتل العملية التي تحتل المنفذ
lsof -i :3000          # للبحث عن من يستخدم 3000
lsof -i :5001          # للبحث عن من يستخدم 5001
kill -9 <PID>          # قتل العملية
```

### ❌ خطأ: MongoDB Connection Failed
```bash
# تحقق من:
1. أن MongoDB Atlas running ✅
2. Connection string صحيح ✅
3. IP Whitelist في MongoDB Atlas ✅
4. Network connection متاحة ✅
```

### ❌ خطأ: Hydration Mismatch
```
This usually means the server-side rendering differs from client-side.
It's already fixed in the current code!
```

### ❌ خطأ: CORS Issues
```bash
# تأكد من:
1. CORS enabled في Backend ✅
2. Origin مسموح في .env ✅
3. Credentials included في requests ✅
```

---

## 📦 إعادة تثبيت المكتبات

إذا واجهت مشاكل في المكتبات:

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 🚀 النشر والإنتاج

### Build للإنتاج

**Backend:**
```bash
cd backend
NODE_ENV=production npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

### خيارات النشر:
- Vercel (Frontend)
- Heroku (Backend)
- AWS (Both)
- DigitalOcean (Both)

---

## 📞 الدعم والمساعدة

### أسئلة شائعة (FAQ):

**س: كيف أضيف منتج؟**
- قم بتسجيل الدخول → Dashboard → Add Product

**س: كيف أغير السعر؟**
- Dashboard → Products → Edit → Update Price

**س: هل يمكن استرجاع منتج؟**
- نعم، خلال 30 يوم من الشراء

**س: كيف أتواصل معهم؟**
- Contact Page → أملأ النموذج أو اتصل مباشرة

---

## 📝 ملاحظات مهمة

⚠️ **قبل الاستخدام:**
- ✅ تأكد من MongoDB Atlas connection
- ✅ تأكد من .env files مُعدة
- ✅ تأكد من Node.js version صحيح
- ✅ تأكد من Ports متوفرة

💡 **نصائح:**
- استخدم نافذتي طرفية منفصلة
- افتح المتصفح في نافذة جديدة
- استخدم DevTools لفحص الأخطاء
- تحقق من Browser console للمشاكل

🔄 **البيانات:**
- جميع البيانات محفوظة في MongoDB
- localStorage يُستخدم للـ UI state فقط
- الـ JWT token يصلح لـ 24 ساعة

---

## 📜 الرخصة

هذا المشروع مفتوح المصدر ومتاح للاستخدام الشخصي والتجاري.

---

## 🎉 شكراً لك!

استمتع بـ **Last Piece** واكتشف القطع الفريدة! ✨

---

**آخر تحديث:** `2026-01-25`  
**الإصدار:** `1.0.0`  
**الحالة:** 🟢 جاهز للاستخدام
