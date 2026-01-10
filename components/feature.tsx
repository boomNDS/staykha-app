import { Building, FileText, ShieldCheck, Zap } from "lucide-react";

const features = [
  {
    title: "จัดการอาคาร & ห้องพัก",
    description:
      "ติดตามสถานะอาคาร ห้องพัก และผู้ดูแลในมุมมองเดียว พร้อมแผนผังห้องที่อัปเดตทันที",
    image: "/electricity-meter-current-reading.jpg",
    icon: Building,
  },
  {
    title: "อ่านมิเตอร์อัตโนมัติ",
    description:
      "อัปโหลดภาพและดึงค่าด้วย OCR เพื่อลดการพิมพ์ซ้ำและส่งต่อข้อมูลอย่างแม่นยำ",
    image: "/electric-meter-reading-990.jpg",
    icon: Zap,
  },
  {
    title: "บิลอัจฉริยะ",
    description:
      "คำนวณค่าน้ำค่าไฟอัตโนมัติ สร้างใบแจ้งหนี้ PDF ภาษาไทย และติดตามสถานะการชำระอย่างเป็นระบบ",
    image: "/electricity-meter-previous-reading.jpg",
    icon: FileText,
  },
  {
    title: "ทีม &สิทธิ์",
    description:
      "กำหนดบทบาทผู้ดูแล ทีมงาน และสิทธิ์เข้าใช้งานได้ที่เดียว พร้อมความปลอดภัยระดับธุรกิจ",
    image: "/placeholder-user.jpg",
    icon: ShieldCheck,
  },
];

export function Features() {
  return (
    <section className="bg-gray-50 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article
              key={feature.title}
              className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="h-full w-full object-cover"
                />
                <span className="absolute right-4 top-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-lg">
                  <Icon className="h-6 w-6 text-slate-800" />
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-3 px-6 py-6">
                <h3 className="text-lg font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  {feature.description}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
