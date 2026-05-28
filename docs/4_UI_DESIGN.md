# دليل التصميم وألوان واجهة المستخدم (UI Design Guidelines)

## 1. المتغيرات والألوان (Design Tokens)
تم استخلاص هذه الألوان من ملفات `dashboard.html` و `gdhd.html` الأصلية، وسيتم تحويلها لمتغيرات `tailwind.config.js` مع `NativeWind` لضمان أن يبدو التطبيق مطابقاً لتصميمك.

### ألوان الإدارة (Admin Dashboard)
- `background`: `#f4f6f9` (فاتح) / `#0b0f19` (داكن)
- `surface`: `#ffffff` (فاتح) / `#151f32` (داكن)
- `primary`: `#4f46e5`
- `success`: `#10b981`
- `warning`: `#f59e0b`
- `info`: `#06b6d4`
- `accent`: `#ff4757`
- `delivery`: `#8b5cf6`

### ألوان واجهة العميل (Client App / CulinaShare)
- `primary-client`: `#944a00`
- `background-client`: `#eefcfd`
- `surface-client`: `#ffffff`
- `secondary`: `#4e6073`
- `outline-variant`: `#dcc1b1`
- `primary-container`: `#e67e22`

## 2. مكتبات المكونات (UI Libraries)
- **NativeWind:** سيتيح لنا استخدام كلاسات Tailwind في React Native مباشرة (مثال: `className="bg-primary text-white p-4 rounded-xl"`).
- **أيقونات (Icons):** سنستخدم مكتبة `@expo/vector-icons` بدلاً من Material Symbols لضمان سرعة وتوافق أفضل مع الموبايل والويب.

## 3. مبادئ التصميم (Design Principles)
- **البطاقات (Cards):** استخدام حواف ناعمة `rounded-xl` وظلال خفيفة `shadow-sm` لتوافق نمط الـ Glassmorphism والتصميم العصري.
- **التفاعل (Feedback):** إضافة مكونات التنبيه السريع (Toasts) باستخدام `react-native-root-toast` كبديل عن التنبيهات المزعجة (alert).
- **الوضعية الليلية (Dark Mode):** يدعم NativeWind الوضع الليلي والنهاري بناءً على إعدادات نظام المستخدم. سيمتلك المدير زراً لتبديل الوضع كما كان في الـ HTML.
