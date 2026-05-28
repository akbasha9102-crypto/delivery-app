# مخطط قاعدة البيانات (Supabase Schema)

## 1. الجداول (Tables)

### `profiles` (المستخدمين)
- `id`: uuid (Primary Key, مرتبط بـ auth.users)
- `email`: string
- `role`: string (إما `admin` أو `client` أو `driver`)
- `full_name`: string
- `phone`: string
- `created_at`: timestamp

### `categories` (الأقسام)
- `id`: uuid (Primary Key)
- `name`: string
- `created_at`: timestamp

### `meals` (الوجبات)
- `id`: uuid (Primary Key)
- `category_id`: uuid (Foreign Key -> categories.id)
- `name`: string
- `description`: text
- `price`: numeric
- `image_url`: string
- `status`: string (available, unavailable)
- `created_at`: timestamp

### `extras` (الإضافات)
- `id`: uuid (Primary Key)
- `meal_id`: uuid (Foreign Key -> meals.id)
- `name`: string
- `price`: numeric
- `image_url`: string
- `created_at`: timestamp

### `orders` (الطلبات)
- `id`: uuid (Primary Key)
- `client_id`: uuid (Foreign Key -> profiles.id)
- `driver_id`: uuid (Foreign Key -> profiles.id, يمكن أن يكون null)
- `status`: string (pending, preparing, delivering, completed, cancelled)
- `total_price`: numeric
- `client_address`: text
- `client_note`: text
- `created_at`: timestamp

### `order_items` (محتويات الطلب)
- `id`: uuid (Primary Key)
- `order_id`: uuid (Foreign Key -> orders.id)
- `meal_id`: uuid (Foreign Key -> meals.id)
- `quantity`: integer
- `price_at_time`: numeric (لحفظ السعر وقت الطلب)

## 2. سياسات الأمان (Row Level Security - RLS)
- **العميل (Client):** يمكنه قراءة الوجبات والأقسام المتاحة، ويمكنه إدراج (Insert) طلبات جديدة، ويمكنه قراءة طلباته فقط (`client_id = auth.uid()`).
- **السائق (Driver):** يمكنه قراءة الطلبات المسندة إليه وتحديث حالتها إلى `completed`.
- **المدير (Admin):** يمتلك كامل الصلاحيات (`ALL`) على جميع الجداول لإضافة وتعديل الوجبات وإدارة جميع الطلبات والسائقين.
