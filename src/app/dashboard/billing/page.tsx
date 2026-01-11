"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import {
  CheckCircle2,
  Clock,
  Droplets,
  FileDown,
  FileText,
  Image,
  Printer,
  Zap,
} from "lucide-react";
import * as React from "react";
import { PrintInvoiceCard } from "@/components/billing/print-invoice-card";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import { TableRowActions } from "@/components/table-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { invoicesApi } from "@/lib/api-client";
import { getErrorMessage, logError } from "@/lib/error-utils";
import { useRouter, useSearchParams } from "@/lib/router";
import type { Invoice } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";
import { formatCurrency } from "@/lib/utils";

export default function BillingPage() {
  usePageTitle("บิล/ใบแจ้งหนี้");

  const router = useRouter();
  const searchParams = useSearchParams();
  const readingId = searchParams.get("readingId");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const invoicesQuery = useQuery({
    queryKey: ["invoices"],
    queryFn: () => invoicesApi.getAll(),
  });
  const invoices = invoicesQuery.data?.invoices ?? [];
  const isLoading = invoicesQuery.isLoading;
  const hasGenerated = React.useRef(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = React.useState<
    Set<string>
  >(new Set());
  const [isExporting, setIsExporting] = React.useState(false);
  const exportRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const [selectedPeriod, setSelectedPeriod] = React.useState(() =>
    new Date().toISOString().slice(0, 7),
  );
  const [updatingInvoiceId, setUpdatingInvoiceId] = React.useState<
    string | null
  >(null);

  const selectionReady = selectedInvoiceIds.size > 0;

  const periodOptions = React.useMemo(() => {
    const options = [{ value: "all", label: "ทุกงวด" }];
    const now = new Date();
    for (let i = 0; i < 12; i += 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleString("th-TH", {
        month: "long",
        year: "numeric",
      });
      options.push({ value, label });
    }
    return options;
  }, []);

  const getInvoicePeriodKey = (invoice: Invoice) => {
    if (!invoice.issueDate) return "";
    const date = new Date(invoice.issueDate);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 7);
  };

  const filteredInvoices = React.useMemo(() => {
    if (selectedPeriod === "all") {
      return invoices;
    }
    return invoices.filter(
      (invoice) => getInvoicePeriodKey(invoice) === selectedPeriod,
    );
  }, [invoices, selectedPeriod]);
  const periodLabel =
    selectedPeriod === "all"
      ? "ทุกงวด"
      : new Date(`${selectedPeriod}-01`).toLocaleString("th-TH", {
          month: "long",
          year: "numeric",
        });

  React.useEffect(() => {
    setSelectedInvoiceIds((prev) => {
      const next = new Set<string>();
      filteredInvoices.forEach((invoice) => {
        if (prev.has(invoice.id)) {
          next.add(invoice.id);
        }
      });
      return next;
    });
  }, [filteredInvoices]);

  const generateInvoiceMutation = useMutation({
    mutationFn: (id: string) => invoicesApi.generateFromReadingGroup(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({
        title: "สร้างใบแจ้งหนี้แล้ว",
        description: `สร้าง ${data.invoice.id} จากการอ่านมิเตอร์รายเดือน`,
      });
      // Only navigate after successful creation
      router.push(`/overview/billing/${data.invoice.id}`);
    },
    onError: (error: any) => {
      // Reset the ref so user can try again
      hasGenerated.current = false;
      logError(error, {
        scope: "invoices",
        action: "generate",
        metadata: { readingGroupId: readingId ?? undefined },
      });
      toast({
        title: "สร้างใบแจ้งหนี้ไม่สำเร็จ",
        description: getErrorMessage(error, "ไม่สามารถสร้างใบแจ้งหนี้ได้"),
        variant: "destructive",
      });
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: (payload: { id: string; updates: Partial<Invoice> }) =>
      invoicesApi.update(payload.id, payload.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  React.useEffect(() => {
    if (
      readingId &&
      !hasGenerated.current &&
      !generateInvoiceMutation.isPending &&
      !generateInvoiceMutation.isSuccess
    ) {
      hasGenerated.current = true;
      generateInvoiceMutation.mutate(readingId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readingId]);

  const selectedInvoices = filteredInvoices.filter((invoice) =>
    selectedInvoiceIds.has(invoice.id),
  );
  const selectedPeriods = React.useMemo(() => {
    const set = new Set<string>();
    selectedInvoices.forEach((invoice) => {
      const period = getInvoicePeriodKey(invoice);
      if (period) set.add(period);
    });
    return set;
  }, [selectedInvoices]);
  const hasMixedSelectedPeriods = selectionReady && selectedPeriods.size > 1;

  const chunkedInvoices = React.useMemo(() => {
    const chunks: Invoice[][] = [];
    for (let i = 0; i < selectedInvoices.length; i += 4) {
      chunks.push(selectedInvoices.slice(i, i + 4));
    }
    return chunks;
  }, [selectedInvoices]);

  const handlePrintSelected = () => {
    if (selectedInvoices.length === 0) {
      toast({
        title: "เลือกใบแจ้งหนี้",
        description: "โปรดเลือกใบแจ้งหนี้อย่างน้อย 1 รายการเพื่อพิมพ์",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "กำลังเตรียมหน้าเอกสารสำหรับพิมพ์",
      description: "ระบบจะเปิดหน้าพิมพ์ในอีกสักครู่",
    });
    window.print();
  };

  const handleExportPng = async () => {
    if (selectedInvoices.length === 0) {
      toast({
        title: "เลือกใบแจ้งหนี้",
        description: "โปรดเลือกใบแจ้งหนี้อย่างน้อย 1 รายการเพื่อส่งออก",
        variant: "destructive",
      });
      return;
    }
    setIsExporting(true);
    try {
      for (const invoice of selectedInvoices) {
        const node = exportRefs.current[invoice.id];
        if (!node) continue;
        const dataUrl = await toPng(node, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: "#ffffff",
        });
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `invoice-${invoice.id}.png`;
        link.click();
      }
    } catch (error) {
      logError(error, {
        scope: "invoices",
        action: "export-png",
        metadata: { count: selectedInvoices.length },
      });
      toast({
        title: "ส่งออกไม่สำเร็จ",
        description: getErrorMessage(error, "ไม่สามารถสร้างไฟล์ PNG ได้"),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (selectedInvoices.length === 0) {
      toast({
        title: "เลือกใบแจ้งหนี้",
        description: "โปรดเลือกใบแจ้งหนี้อย่างน้อย 1 รายการเพื่อส่งออก",
        variant: "destructive",
      });
      return;
    }
    setIsExporting(true);
    try {
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      for (let i = 0; i < selectedInvoices.length; i += 1) {
        const invoice = selectedInvoices[i];
        const node = exportRefs.current[invoice.id];
        if (!node) continue;
        const dataUrl = await toPng(node, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: "#ffffff",
        });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth;
        const imgHeight = pageHeight;
        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(dataUrl, "PNG", 0, 0, imgWidth, imgHeight);
      }
      pdf.save("staykha-invoices.pdf");
    } catch (error) {
      logError(error, {
        scope: "invoices",
        action: "export-pdf",
        metadata: { count: selectedInvoices.length },
      });
      toast({
        title: "ส่งออกไม่สำเร็จ",
        description: getErrorMessage(error, "ไม่สามารถสร้างไฟล์ PDF ได้"),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = async (invoiceId: string) => {
    try {
      const blob = await invoicesApi.downloadPdf(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      logError(error, {
        scope: "invoices",
        action: "download-pdf",
        metadata: { invoiceId },
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "pending":
      case "sent":
        return "secondary";
      case "overdue":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "ชำระแล้ว";
      case "pending":
        return "รอชำระ";
      case "sent":
        return "ส่งแล้ว";
      case "overdue":
        return "ค้างชำระ";
      case "draft":
        return "ร่าง";
      default:
        return status;
    }
  };

  const totalRevenue = filteredInvoices.reduce(
    (sum, inv) => sum + inv.total,
    0,
  );
  const paidInvoices = filteredInvoices.filter((inv) => inv.status === "paid");
  const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const pendingAmount = filteredInvoices
    .filter((inv) => inv.status === "pending" || inv.status === "sent")
    .reduce((sum, inv) => sum + inv.total, 0);
  const overdueAmount = filteredInvoices
    .filter((inv) => inv.status === "overdue")
    .reduce((sum, inv) => sum + inv.total, 0);

  const columns = [
    {
      key: "invoiceNumber",
      header: "เลขที่ใบแจ้งหนี้",
      searchable: true,
      render: (invoice: Invoice) => (
        <span className="font-mono text-foreground">{invoice.id}</span>
      ),
    },
    {
      key: "tenant",
      header: "ผู้เช่า",
      searchable: true,
      className: "hidden sm:table-cell",
      render: (invoice: Invoice) => (
        <span className="font-medium text-foreground">
          {invoice.tenantName || "—"}
        </span>
      ),
    },
    {
      key: "room",
      header: "ห้อง",
      searchable: true,
      render: (invoice: Invoice) => (
        <span className="text-muted-foreground">
          {invoice.roomNumber || invoice.roomId}
        </span>
      ),
    },
    {
      key: "billingPeriod",
      header: "งวด",
      searchable: true,
      className: "hidden md:table-cell",
      render: (invoice: Invoice) => (
        <span className="text-muted-foreground">{invoice.billingPeriod}</span>
      ),
    },
    {
      key: "usage",
      header: "หน่วยใช้",
      className: "hidden lg:table-cell",
      render: (invoice: Invoice) => (
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Droplets className="h-3 w-3 text-blue-500" />
            {invoice.waterBillingMode === "fixed"
              ? "เหมาจ่าย"
              : `${invoice.waterUsage} m³`}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Zap className="h-3 w-3 text-amber-500" />
            {invoice.electricUsage} kWh
          </span>
        </div>
      ),
    },
    {
      key: "total",
      header: "ยอดเงิน",
      render: (invoice: Invoice) => (
        <span className="font-semibold text-foreground">
          {formatCurrency(invoice.total)}
        </span>
      ),
    },
    {
      key: "status",
      header: "สถานะ",
      render: (invoice: Invoice) => {
        const dueDateLabel = new Date(invoice.dueDate).toLocaleDateString(
          "th-TH",
        );
        return (
          <div className="space-y-1">
            <Badge variant={getStatusColor(invoice.status)}>
              {getStatusLabel(invoice.status)}
            </Badge>
            <p className="text-xs text-muted-foreground">
              ครบกำหนด {dueDateLabel}
            </p>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "การดำเนินการ",
      render: (invoice: Invoice) => (
        <TableRowActions
          primary={{
            label: "ดูรายละเอียด",
            icon: FileText,
            onClick: () => router.push(`/overview/billing/${invoice.id}`),
          }}
          items={[
            {
              label:
                updatingInvoiceId === invoice.id &&
                updateInvoiceMutation.isPending
                  ? "กำลังอัปเดต..."
                  : invoice.status === "paid"
                    ? "ทำเป็นรอชำระ"
                    : "ทำเป็นชำระแล้ว",
              icon: invoice.status === "paid" ? Clock : CheckCircle2,
              disabled:
                updatingInvoiceId === invoice.id &&
                updateInvoiceMutation.isPending,
              onClick: async () => {
                setUpdatingInvoiceId(invoice.id);
                try {
                  await updateInvoiceMutation.mutateAsync({
                    id: invoice.id,
                    updates:
                      invoice.status === "paid"
                        ? { status: "pending", paidDate: null }
                        : {
                            status: "paid",
                            paidDate: new Date().toISOString(),
                          },
                  });
                } finally {
                  setUpdatingInvoiceId(null);
                }
              },
            },
            {
              label: "ดาวน์โหลด PDF",
              icon: FileDown,
              onClick: () => handleDownloadPdf(invoice.id),
            },
          ]}
        />
      ),
    },
  ];

  const filters = [
    {
      key: "status",
      label: "สถานะ",
      options: [
        { value: "paid", label: "ชำระแล้ว" },
        { value: "pending", label: "รอชำระ" },
        { value: "overdue", label: "ค้างชำระ" },
      ],
      filterFn: (invoice: Invoice, value: string) => invoice.status === value,
    },
  ];

  const isGeneratingInvoice = generateInvoiceMutation.isPending;

  return (
    <div className="space-y-6 pb-8 sm:space-y-8">
      {/* Loading overlay when generating invoice */}
      {isGeneratingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <CardTitle className="text-center">กำลังสร้างใบแจ้งหนี้</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4 p-8">
              <LoadingState message="กรุณารอสักครู่ ระบบกำลังสร้างใบแจ้งหนี้ให้คุณ..." />
            </CardContent>
          </Card>
        </div>
      )}

      <PageHeader
        title="บิล/ใบแจ้งหนี้"
        description="จัดการการคำนวณบิลและสร้างใบแจ้งหนี้ค่าน้ำ/ค่าไฟ"
        actions={
          <>
            <Select
              value={selectedPeriod}
              onValueChange={(value) => setSelectedPeriod(value)}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="เลือกงวดบิล" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground">
              {selectedInvoiceIds.size} รายการที่เลือก
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintSelected}
              disabled={isExporting || !selectionReady}
              title={!selectionReady ? "โปรดเลือกใบแจ้งหนี้ก่อน" : undefined}
            >
              <Printer className="mr-2 h-4 w-4" />
              พิมพ์ 4/หน้า
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPng}
              disabled={isExporting || !selectionReady}
              title={!selectionReady ? "โปรดเลือกใบแจ้งหนี้ก่อน" : undefined}
            >
              <Image className="mr-2 h-4 w-4" />
              ส่งออก PNG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={isExporting || !selectionReady}
              title={!selectionReady ? "โปรดเลือกใบแจ้งหนี้ก่อน" : undefined}
            >
              <FileDown className="mr-2 h-4 w-4" />
              ส่งออก PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedInvoiceIds(new Set())}
              disabled={selectedInvoiceIds.size === 0}
            >
              ล้าง
            </Button>
          </>
        }
      />

      {hasMixedSelectedPeriods ? (
        <Alert>
          <AlertTitle>งวดบิลที่เลือกไม่ตรงกัน</AlertTitle>
          <AlertDescription>
            มีใบแจ้งหนี้จากหลายงวดในรายการที่เลือก ควรส่งออกหรือพิมพ์แยกตามงวด
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              รายรับรวม
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredInvoices.length} ใบแจ้งหนี้ • {periodLabel}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ชำระแล้ว
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(paidAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {paidInvoices.length} ใบแจ้งหนี้ที่ชำระแล้ว
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              รอชำระ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(pendingAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {
                invoices.filter(
                  (inv) => inv.status === "pending" || inv.status === "sent",
                ).length
              }{" "}
              รอชำระ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ค้างชำระ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(overdueAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter((inv) => inv.status === "overdue").length}{" "}
              ค้างชำระ
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการใบแจ้งหนี้ทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState message="กำลังโหลดใบแจ้งหนี้..." />
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8 text-muted-foreground" />}
              title="ยังไม่มีใบแจ้งหนี้"
              description="ใบแจ้งหนี้จะแสดงเมื่อมีการประมวลผลการอ่านมิเตอร์"
              actionLabel="ดูการอ่านมิเตอร์"
              actionHref="/overview/readings"
            />
          ) : filteredInvoices.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8 text-muted-foreground" />}
              title="ยังไม่มีใบแจ้งหนี้ในงวดนี้"
              description={`ไม่พบใบแจ้งหนี้สำหรับ ${periodLabel}`}
              actionLabel="ดูการอ่านมิเตอร์"
              actionHref="/overview/readings"
            />
          ) : (
            <DataTable
              data={filteredInvoices}
              columns={columns}
              searchPlaceholder="ค้นหาตามเลขใบแจ้งหนี้ ผู้เช่า ห้อง หรือรอบบิล..."
              filters={filters}
              pageSize={10}
              forcePagination
              getRowId={(invoice) => invoice.id}
              selectedRowIds={selectedInvoiceIds}
              onSelectionChange={setSelectedInvoiceIds}
              selectionLabel="เลือกใบแจ้งหนี้"
            />
          )}
        </CardContent>
      </Card>

      {/* Print Area - Hidden on screen, visible when printing */}
      <div className="print-only print-area">
        {chunkedInvoices.length > 0 ? (
          chunkedInvoices.map((chunk, index) => (
            <div key={`print-page-${index}`} className="print-page">
              <div className="print-grid">
                {chunk.map((invoice) => (
                  <PrintInvoiceCard
                    key={invoice.id}
                    invoice={invoice}
                    className="print-card"
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="print-page">
            <div className="print-grid">
              <p>ยังไม่ได้เลือกใบแจ้งหนี้สำหรับพิมพ์</p>
            </div>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute -left-[9999px] -top-[9999px] opacity-0">
        {selectedInvoices.map((invoice) => (
          <div
            key={`export-${invoice.id}`}
            ref={(node) => {
              exportRefs.current[invoice.id] = node;
            }}
            className="h-[1123px] w-[794px] bg-white p-8"
          >
            <PrintInvoiceCard invoice={invoice} />
          </div>
        ))}
      </div>
    </div>
  );
}
