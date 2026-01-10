"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { Download, Droplets, Loader2, Zap } from "lucide-react";
import * as React from "react";
import { PrintInvoiceCard } from "@/components/billing/print-invoice-card";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { invoicesApi } from "@/lib/api-client";
import { useParams, useRouter } from "@/lib/router";
import type { Invoice } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";
import { formatCurrency } from "@/lib/utils";

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  usePageTitle(`ใบแจ้งหนี้ ${invoiceId}`);

  const router = useRouter();
  const { toast } = useToast();

  const [isDownloading, setIsDownloading] = React.useState(false);
  const printCardRef = React.useRef<HTMLDivElement>(null);

  const invoiceQuery = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => invoicesApi.getById(invoiceId),
    enabled: Boolean(invoiceId),
  });
  const invoice = invoiceQuery.data?.invoice ?? null;
  const queryClient = useQueryClient();
  const updateInvoiceMutation = useMutation({
    mutationFn: (payload: { id: string; updates: Partial<Invoice> }) =>
      invoicesApi.update(payload.id, payload.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const handleDownloadPdf = async () => {
    if (!invoice) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่พบข้อมูลใบแจ้งหนี้สำหรับสร้างไฟล์ PDF",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    try {
      // Wait a bit to ensure the component is fully rendered
      await new Promise((resolve) => setTimeout(resolve, 100));

      const node = printCardRef.current;
      if (!node) {
        throw new Error("ไม่พบองค์ประกอบใบแจ้งหนี้");
      }

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        quality: 1,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const imgProps = pdf.getImageProperties(dataUrl);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(
        pageWidth / imgProps.width,
        pageHeight / imgProps.height,
      );
      const imgWidth = imgProps.width * ratio;
      const imgHeight = imgProps.height * ratio;
      const x = (pageWidth - imgWidth) / 2;
      const y = 24;
      pdf.addImage(dataUrl, "PNG", x, y, imgWidth, imgHeight);
      pdf.save(`invoice-${invoice.invoiceNumber || invoiceId}.pdf`);

      toast({
        title: "ดาวน์โหลด PDF แล้ว",
        description: "ดาวน์โหลดใบแจ้งหนี้ PDF สำเร็จ",
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "ดาวน์โหลด PDF ไม่สำเร็จ",
        description:
          error instanceof Error
            ? error.message
            : "ไม่สามารถสร้างไฟล์ PDF ได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (invoiceQuery.isLoading) {
    return <LoadingState fullScreen message="กำลังโหลดใบแจ้งหนี้..." />;
  }

  if (!invoice) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <p className="text-muted-foreground">ไม่พบใบแจ้งหนี้</p>
        <Button
          variant="link"
          onClick={() => router.push("/overview/billing")}
          className="mt-2"
        >
          กลับไปหน้าใบแจ้งหนี้
        </Button>
      </div>
    );
  }

  const waterConsumption = invoice.waterConsumption ?? invoice.waterUsage ?? 0;
  const electricConsumption =
    invoice.electricConsumption ?? invoice.electricUsage ?? 0;
  const waterRate = invoice.waterRatePerUnit ?? invoice.waterRate ?? 0;
  const electricRate = invoice.electricRatePerUnit ?? invoice.electricRate ?? 0;
  const waterSubtotal = invoice.waterSubtotal ?? invoice.waterAmount ?? 0;
  const electricSubtotal =
    invoice.electricSubtotal ?? invoice.electricAmount ?? 0;
  const issuedAt =
    invoice.createdAt ?? invoice.issueDate ?? new Date().toISOString();
  const waterReading = invoice.readings?.find(
    (reading) => reading.meterType === "water",
  );
  const electricReading = invoice.readings?.find(
    (reading) => reading.meterType === "electric",
  );
  const roomRent = invoice.room?.monthlyRent ?? null;
  const isWaterFixed = invoice.waterBillingMode === "fixed";

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="ตัวอย่างใบแจ้งหนี้"
        description={invoice.invoiceNumber}
        showBack
        actions={
          <>
            <Button
              variant="outline"
              onClick={() =>
                updateInvoiceMutation.mutate({
                  id: invoice.id,
                  updates:
                    invoice.status === "paid"
                      ? { status: "pending", paidDate: null }
                      : { status: "paid", paidDate: new Date().toISOString() },
                })
              }
            >
              {invoice.status === "paid" ? "ทำเป็นรอชำระ" : "ทำเป็นชำระแล้ว"}
            </Button>
            <Button onClick={handleDownloadPdf} disabled={isDownloading}>
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังดาวน์โหลด...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  ดาวน์โหลด PDF
                </>
              )}
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-xl sm:text-2xl">
                บิลค่าสาธารณูปโภค
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                รอบบิล: {invoice.billingPeriod}
              </p>
            </div>
            <Badge
              variant={invoice.status === "paid" ? "default" : "secondary"}
            >
              {invoice.status === "paid"
                ? "ชำระแล้ว"
                : invoice.status === "pending"
                  ? "รอชำระ"
                  : invoice.status === "overdue"
                    ? "ค้างชำระ"
                    : invoice.status === "sent"
                      ? "ส่งแล้ว"
                      : "ร่าง"}
            </Badge>
          </div>
          {isWaterFixed && (
            <Badge variant="outline" className="mt-2">
              ค่าน้ำแบบเหมาจ่าย
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-6 print:bg-white print:text-black">
          {/* Tenant & Room Info */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                ออกบิลถึง
              </p>
              <p className="font-semibold text-foreground">
                {invoice.tenant?.name || invoice.tenantName || "—"}
              </p>
              <p className="text-sm text-muted-foreground">
                {invoice.tenant?.email || "—"}
              </p>
              <p className="text-sm text-muted-foreground">
                {invoice.tenant?.phone || "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                รายละเอียดห้อง
              </p>
              <p className="font-semibold text-foreground">
                ห้อง {invoice.room?.roomNumber || invoice.roomNumber}
              </p>
              <p className="text-sm text-muted-foreground">
                {invoice.room?.buildingName || "—"}, ชั้น{" "}
                {invoice.room?.floor ?? "—"}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-4 font-semibold text-foreground">สรุปยอดบิล</h3>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">รายการ</th>
                    <th className="px-4 py-3 text-center font-medium">
                      เลขก่อนหน้า
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      เลขล่าสุด
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      จำนวนเงิน
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-4 py-3 font-medium text-foreground">
                      ค่าเช่าห้อง
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      —
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      —
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {roomRent ? formatCurrency(roomRent) : "—"}
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-blue-500" />
                        ค่าน้ำ {isWaterFixed ? "(เหมาจ่าย)" : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {isWaterFixed
                        ? "—"
                        : waterReading?.previousReading != null
                          ? waterReading.previousReading.toLocaleString()
                          : "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {isWaterFixed
                        ? "—"
                        : waterReading?.currentReading != null
                          ? waterReading.currentReading.toLocaleString()
                          : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {formatCurrency(waterSubtotal)}
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        ค่าไฟ
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {electricReading?.previousReading != null
                        ? electricReading.previousReading.toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {electricReading?.currentReading != null
                        ? electricReading.currentReading.toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {formatCurrency(electricSubtotal)}
                    </td>
                  </tr>
                  <tr className="border-t bg-muted/20">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      รวมย่อย
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      —
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      —
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {formatCurrency(invoice.subtotal)}
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      ภาษี (7%)
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      —
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      —
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {formatCurrency(invoice.tax)}
                    </td>
                  </tr>
                  <tr className="border-t bg-primary/5">
                    <td className="px-4 py-3 text-base font-semibold text-foreground">
                      ยอดรวมทั้งหมด
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      —
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      —
                    </td>
                    <td className="px-4 py-3 text-right text-lg font-semibold text-primary">
                      {formatCurrency(invoice.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 grid gap-3 rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>ใช้น้ำ</span>
                  <span className="font-mono text-foreground">
                    {isWaterFixed ? "เหมาจ่าย" : `${waterConsumption} m³`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>อัตราค่าน้ำ</span>
                  <span className="font-mono text-foreground">
                    {isWaterFixed
                      ? formatCurrency(invoice.waterFixedFee ?? 0)
                      : `${formatCurrency(waterRate)}/m³`}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>ใช้ไฟ</span>
                  <span className="font-mono text-foreground">
                    {electricConsumption} kWh
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>อัตราค่าไฟ</span>
                  <span className="font-mono text-foreground">
                    {formatCurrency(electricRate)}/kWh
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Info */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">วันที่ออกบิล</span>
                <span className="text-foreground">
                  {new Date(issuedAt).toLocaleDateString("th-TH")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">วันครบกำหนด</span>
                <span className="font-medium text-foreground">
                  {new Date(invoice.dueDate).toLocaleDateString("th-TH")}
                </span>
              </div>
              {invoice.paidDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">วันที่ชำระ</span>
                  <span className="text-foreground">
                    {new Date(invoice.paidDate).toLocaleDateString("th-TH")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thai Format Invoice (Print View) */}
      <div className="print-only print-area">
        <PrintInvoiceCard invoice={invoice} />
      </div>

      {/* Thai Format Invoice (Screen View) - Used for PDF generation */}
      <Card className="screen-only print:hidden">
        <CardHeader>
          <CardTitle>ใบแจ้งหนี้ (รูปแบบไทย)</CardTitle>
          <CardDescription>รูปแบบสำหรับพิมพ์ตามสไตล์ใบแจ้งหนี้ไทย</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            ref={printCardRef}
            className="bg-white w-full max-w-full overflow-visible"
          >
            <PrintInvoiceCard invoice={invoice} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
