<div align="center">
  <h1 align="center">🛵 تطبيق التوصيل وإدارة الطلبات الحية (CulinaShare)</h1>
  <p align="center">
    تطبيق عصري مبني بـ <b>React Native (Expo)</b> و <b>Supabase</b> لتلبية احتياجات العملاء والإدارة الذكية للطلبات.
    <br />
    <br />
    <a href="https://expo.dev/">Expo</a>
    ·
    <a href="https://supabase.com/">Supabase</a>
    ·
    <a href="https://www.nativewind.dev/">NativeWind</a>
    ·
    <a href="https://vercel.com/">Vercel</a>
  </p>
</div>

## ✨ نظرة عامة
تم تصميم وتطوير هذا المشروع ليكون حلاً شاملاً لإدارة مطاعم التوصيل وتتبع الطلبات. بفضل استخدام تقنية **Expo for Web**، يعمل التطبيق بسلاسة على الويب (كدليل حي للمطعم) وعلى الهواتف كتطبيق أندرويد و iOS (Cross-platform).

## 🚀 المميزات الأساسية (Features)
- 🔐 **نظام مصادقة متكامل:** دخول آمن للإدارة والعملاء مدعوم من `Supabase Auth` مع حماية ذكية للمسارات (Route Guards).
- 📱 **واجهات العملاء (Client App):**
  - استعراض ديناميكي لقائمة الطعام (المنيو).
  - سلة مشتريات تفاعلية لحساب الإجمالي المباشر.
- ⚙️ **لوحة التحكم (Admin Dashboard):**
  - لوحة إحصائيات حية (المبيعات، الطلبات المكتملة، السائقين المتاحين).
  - نظام تبويبات متقدم لإدارة الطلبات الواردة (واردة، تجهيز، توصيل).
- 🎨 **تصميم عصري:** واجهات مستخدم مريحة للعين (Glassmorphism & Clean UI) تم بناؤها باستخدام `NativeWind` لضمان تطابق كلاسات `TailwindCSS`.

## 🛠 التكنولوجيا المستخدمة (Tech Stack)
- **Front-end:** React Native, Expo, Expo Router
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Back-end & Database:** Supabase (PostgreSQL, Auth, RLS)
- **Deployment & CI/CD:** Vercel (Auto-Deployment from GitHub)

## 📁 الهيكلة التنظيمية لمجلدات المشروع
يحتوي المشروع على مجلد `docs` المسمى بـ **"عقل المشروع"** والذي يضم التوثيق الهندسي الدقيق (يرجى مراجعته لفهم أعمق للبرمجة):
- `docs/1_ARCHITECTURE.md`: الهيكلة التقنية.
- `docs/2_DATABASE_SUPABASE.md`: هيكل الجداول في قاعدة البيانات.
- `docs/3_AUTH_FLOW.md`: مسارات تسجيل الدخول وصلاحيات المستخدمين.
- `docs/4_UI_DESIGN.md`: دليل الألوان والتصميم.

## ⚙️ التحديث التلقائي المستمر (CI/CD)
هذا المشروع مرتبط بشكل مباشر عبر **GitHub** بخدمة الرفع **Vercel**. 
بمجرد قيام المطور بأي تعديل على الكود وحفظه، تقوم Vercel ببناء المشروع ونشر التحديث الجديد خلال ثوانٍ معدودة وبدون أي تدخل يدوي!

## 💻 طريقة التشغيل المحلي (للمطورين)
```bash
# 1. تثبيت الحزم
npm install

# 2. بدء سيرفر التطوير
npm start

# لفتح التطبيق على الويب
npm run web

# لفتح التطبيق على محاكي الأندرويد
npm run android
```

---
<div align="center">
  <sub>تمت هندسة وبناء هذا المشروع بعناية ليجمع بين سهولة الاستخدام للمتلقي، ومرونة التحديث للمطور.</sub>
</div>
