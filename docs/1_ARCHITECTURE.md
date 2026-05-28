# الهيكلة التقنية (Architecture) لمشروع التوصيل

## 1. التكنولوجيا المستخدمة (Tech Stack)
- **إطار العمل (Framework):** React Native باستخدام Expo (مما يتيح التصدير للويب Vercel وللموبايل iOS/Android).
- **التوجيه (Routing):** Expo Router (توجيه يعتمد على الملفات File-based routing مثل Next.js).
- **التصميم (Styling):** NativeWind (لاستخدام نفس كلاسات Tailwind CSS الموجودة في التصميم القديم).
- **قاعدة البيانات والمصادقة (Backend & Auth):** Supabase (لإدارة الجلسات، بيانات المستخدمين، وقاعدة البيانات الحية Realtime).

## 2. هيكلة المجلدات (Folder Structure)
```
DeliveryApp/
├── src/
│   ├── app/                # شاشات التطبيق (Expo Router)
│   │   ├── _layout.tsx     # التخطيط الرئيسي وحماية المسارات
│   │   ├── index.tsx       # الشاشة الافتراضية (إعادة توجيه حسب الدور)
│   │   ├── (auth)/         # مسارات تسجيل الدخول (login, register)
│   │   ├── (client)/       # مسارات العميل (المنيو، السلة، التتبع)
│   │   └── (admin)/        # مسارات الإدارة (لوحة التحكم، السائقين)
│   ├── components/         # المكونات القابلة لإعادة الاستخدام (Cards, Buttons, Modals)
│   ├── lib/                # إعدادات خارجية مثل supabase.js
│   ├── hooks/              # Custom Hooks (مثال: useAuth, useCart)
│   └── types/              # تعريفات الأنواع (TypeScript Interfaces)
├── docs/                   # ملفات توثيق "عقل المشروع"
├── assets/                 # الصور والخطوط
└── app.json                # إعدادات تطبيق Expo
```

## 3. التكامل والنشر (CI/CD)
- **الكود المصدري:** سيتم استضافته على GitHub.
- **التحديث التلقائي:** سيتم ربط مستودع GitHub بـ Vercel. 
- **سير العمل (Workflow):** أي تعديل تقوم به من الهاتف عبر Cloud CMD وتعمل له Commit، سيتم نشره تلقائياً على Vercel لنسخة الويب، ويمكن بناء نسخة التطبيق الأصلية عبر EAS Build.
