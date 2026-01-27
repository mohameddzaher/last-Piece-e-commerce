# ✅ تشغيل التطبيق بشكل منفصل

## الطريقة الصحيحة

### Terminal 1 - Backend

```bash
cd /Users/mohamedzaher/Desktop/last-piece/backend
npm run dev
```

**النتيجة المتوقعة:**
```
Server running on port 5001 in development mode
MongoDB Connected: ...
```

### Terminal 2 - Frontend

```bash
cd /Users/mohamedzaher/Desktop/last-piece/frontend
npm run dev
```

**النتيجة المتوقعة:**
```
▲ Next.js 14.2.35
- Local: http://localhost:3000
✓ Ready in ...ms
```

---

## الوصول للتطبيق

**Frontend:** http://localhost:3000  
**Backend API:** http://localhost:5001/api  
**Health Check:** http://localhost:5001/api/health  

---

## من الرئيسي (اختياري - غير مستخدم الآن)

```bash
# من الرئيسي فقط إذا أردت
npm run dev:backend    # في terminal منفصل
npm run dev:frontend   # في terminal منفصل
```

---

## المشاكل المصلحة

✅ **Hydration Error**: إضافة `_app.jsx` و `_document.jsx`  
✅ **Route / not found**: إضافة root endpoint  
✅ **npm run dev**: إزالة concurrently - شغّل منفصل  

---

**الآن جاهز! ابدأ الآن.**
