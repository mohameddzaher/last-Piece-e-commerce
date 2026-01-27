# 🚀 بدء سريع - Quick Start

## خطوات التشغيل | Getting Started

### 1. تشغيل الخوادم | Start Servers

**الخادم الخلفي | Backend:**
```bash
cd backend
npm install  # إذا لم تثبّت المكتبات
NODE_ENV=development nodemon src/server.js
```

**الخادم الأمامي | Frontend:**
```bash
cd frontend
npm install  # إذا لم تثبّت المكتبات
npm run dev
```

### 2. فتح الموقع | Open Website

```
http://localhost:3001
```

---

## بيانات الدخول | Login Credentials

### حساب الإدمن | Admin Account
```
Email: admin@lastpiece.com
Password: Admin@12345
```

### حساب المستخدم | User Account
```
Email: user@lastpiece.com
Password: User@12345
```

---

## الصفحات المتاحة | Available Pages

| الصفحة | الرابط | الوصف |
|------|------|------|
| الرئيسية | `/` | Homepage مع showcase للمنتجات |
| المنتجات | `/products` | جميع الأحذية مع بحث وفلترة |
| عن الموقع | `/about` | معلومات عن Last Piece |
| اتصل بنا | `/contact` | نموذج التواصل |
| السلة | `/cart` | عربة التسوق |
| الدخول | `/login` | صفحة تسجيل الدخول |
| التسجيل | `/register` | صفحة إنشاء حساب جديد |
| لوحة التحكم | `/dashboard` | dashboard خاص بالمستخدم |

---

## المنتجات | Products

✅ **11 منتج متوفر:**

1. Nike Air Force 1 Low - $129.99
2. Adidas Ultraboost 22 - $199.99
3. Puma RS-X Softcase - $99.99
4. Converse Chuck Taylor - $69.99
5. New Balance 990v6 - $219.99
6. Vans Old Skool Pro - $89.99
7. Jordan 1 Retro High - $249.99
8. Saucony Endorphin Speed 3 - $179.99
9. ASICS Gel-Lyte V - $139.99
10. Reebok Classic Leather - $109.99
11. Salomon XT-6 - $169.99

---

## الميزات | Features

✅ بحث عن المنتجات
✅ فلترة حسب السعر والفئة
✅ ترتيب حسب السعر والحداثة
✅ إضافة إلى السلة
✅ إضافة إلى قائمة الرغبات
✅ حساب شخصي
✅ نظام مصادقة آمن
✅ تصميم متجاوب
✅ Dark Mode
✅ صور عالية الجودة

---

## تغيير البيانات | Customization

### إضافة منتجات جديدة | Add Products
```bash
cd backend
# عدّل seed-products.js
node seed-products.js
```

### إضافة حسابات جديدة | Add Accounts
```bash
cd backend
# عدّل create-test-accounts.js
node create-test-accounts.js
```

### تغيير الصور | Change Images
- استخدم روابط من Unsplash أو أي موقع آخر
- عدّل الروابط في `/backend/seed-products.js`
- شغّل السكريبت مرة أخرى

---

## المشاكل الشائعة | Troubleshooting

### الخادم لا يشتغل
```bash
# تأكد من تثبيت المكتبات
npm install

# تأكد من ملف .env
cat .env

# أعد تشغيل
npm run dev
```

### لا تظهر المنتجات
```bash
# أعد تشغيل السكريبت
cd backend
node seed-products.js
```

### مشاكل الدخول
- تأكد من البريد والكلمة
- أعد تحميل الصفحة
- امسح cookies

---

## المراجع | References

- [Nextjs Docs](https://nextjs.org/docs)
- [Express Docs](https://expressjs.com)
- [MongoDB Docs](https://docs.mongodb.com)
- [Tailwind CSS](https://tailwindcss.com)

---

**اضغط هنا للدخول | Click here to login:**
http://localhost:3001/login
