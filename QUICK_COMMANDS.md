# 🎯 أوامر سريعة

## ▶️ تشغيل التطبيق

```bash
# تشغيل Frontend + Backend معاً
npm run dev

# تشغيل Backend فقط
npm run dev --workspace=backend

# تشغيل Frontend فقط
npm run dev --workspace=frontend
```

## 📍 الوصول

```
Frontend:  http://localhost:3000
Backend:   http://localhost:5001
API:       http://localhost:5001/api
```

## 🔐 بيانات قاعدة البيانات

```
Username: energizetechsolutions_db_user
Password: vAkzzk02DtuymE50
URI: mongodb+srv://energizetechsolutions_db_user:vAkzzk02DtuymE50@lastpiece.x0kqkhx.mongodb.net/?appName=lastPiece
```

## 🧪 اختبار سريع

```bash
# اختبر الاتصال بـ Backend
curl http://localhost:5001/api/health

# احصل على جميع المنتجات
curl http://localhost:5001/api/products

# ابحث عن منتج
curl "http://localhost:5001/api/products/search?q=unique"
```

## 📝 الملفات المهمة

```
/backend/.env           - إعدادات الخادم الخلفي
/frontend/.env.local    - إعدادات الخادم الأمامي
jsconfig.json           - إعدادات المسارات
```

## 🛑 إيقاف التطبيق

```bash
# في Terminal: Ctrl + C
```

## 🔄 إعادة التشغيل

```bash
Ctrl + C  # لإيقاف
npm run dev  # لإعادة التشغيل
```

---

**✅ كل شيء جاهز الآن!**
