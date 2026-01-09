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
import { useToast } from "@/hooks/use-toast";
import { invoicesApi } from "@/lib/api-client";
import { useRouter, useSearchParams } from "@/lib/router";
import type { Invoice } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";
import { formatCurrency } from "@/lib/utils";

export default function BillingPage() {
  usePageTitle("Billing");

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

  const selectionReady = selectedInvoiceIds.size > 0;

  React.useEffect(() => {
    setSelectedInvoiceIds((prev) => {
      const next = new Set<string>();
      invoices.forEach((invoice) => {
        if (prev.has(invoice.id)) {
          next.add(invoice.id);
        }
      });
      return next;
    });
  }, [invoices]);

  const generateInvoiceMutation = useMutation({
    mutationFn: (id: string) => invoicesApi.generateFromReadingGroup(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({
        title: "Invoice created",
        description: `Generated ${data.invoice.id} from monthly readings.`,
      });
      router.push(`/overview/billing/${data.invoice.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Invoice failed",
        description: error.message || "Could not generate invoice",
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
    if (readingId && !hasGenerated.current) {
      hasGenerated.current = true;
      generateInvoiceMutation.mutate(readingId);
    }
  }, [readingId, generateInvoiceMutation]);

  const selectedInvoices = invoices.filter((invoice) =>
    selectedInvoiceIds.has(invoice.id),
  );

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
        title: "Select invoices",
        description: "Choose at least one invoice to print.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Preparing print layout",
      description: "The system will open the print dialog shortly.",
    });
    window.print();
  };

  const handleExportPng = async () => {
    if (selectedInvoices.length === 0) {
      toast({
        title: "Select invoices",
        description: "Choose at least one invoice to export.",
        variant: "destructive",
      });
      return;
    }
    setIsExporting(true);
    try {
      for (const invoice of selectedInvoices) {
        const node = exportRefs.current[invoice.id];
        if (!node) continue;
        const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2 });
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `invoice-${invoice.id}.png`;
        link.click();
      }
    } catch (error) {
      console.error("Failed to export PNG:", error);
      toast({
        title: "Export failed",
        description: "Could not generate PNG files.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (selectedInvoices.length === 0) {
      toast({
        title: "Select invoices",
        description: "Choose at least one invoice to export.",
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
        const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2 });
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
        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(dataUrl, "PNG", x, y, imgWidth, imgHeight);
      }
      pdf.save("staykha-invoices.pdf");
    } catch (error) {
      console.error("Failed to export PDF:", error);
      toast({
        title: "Export failed",
        description: "Could not generate PDF.",
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
      console.error("Error downloading PDF:", error);
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

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const paidInvoices = invoices.filter((inv) => inv.status === "paid");
  const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const pendingAmount = invoices
    .filter((inv) => inv.status === "pending" || inv.status === "sent")
    .reduce((sum, inv) => sum + inv.total, 0);
  const overdueAmount = invoices
    .filter((inv) => inv.status === "overdue")
    .reduce((sum, inv) => sum + inv.total, 0);

  const columns = [
    {
      key: "invoiceNumber",
      header: "Invoice #",
      searchable: true,
      render: (invoice: Invoice) => (
        <span className="font-mono text-foreground">{invoice.id}</span>
      ),
    },
    {
      key: "tenant",
      header: "Tenant",
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
      header: "Room",
      searchable: true,
      render: (invoice: Invoice) => (
        <span className="text-muted-foreground">
          {invoice.roomNumber || invoice.roomId}
        </span>
      ),
    },
    {
      key: "billingPeriod",
      header: "Period",
      searchable: true,
      className: "hidden md:table-cell",
      render: (invoice: Invoice) => (
        <span className="text-muted-foreground">{invoice.billingPeriod}</span>
      ),
    },
    {
      key: "usage",
      header: "Usage",
      className: "hidden lg:table-cell",
      render: (invoice: Invoice) => (
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Droplets className="h-3 w-3 text-blue-500" />
            {invoice.waterBillingMode === "fixed"
              ? "Fixed fee"
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
      header: "Amount",
      render: (invoice: Invoice) => (
        <span className="font-semibold text-foreground">
          {formatCurrency(invoice.total)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (invoice: Invoice) => {
        const dueDateLabel = new Date(invoice.dueDate).toLocaleDateString();
        return (
          <div className="space-y-1">
            <Badge variant={getStatusColor(invoice.status)}>
              {invoice.status}
            </Badge>
            <p className="text-xs text-muted-foreground">Due {dueDateLabel}</p>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (invoice: Invoice) => (
        <TableRowActions
          primary={{
            label: "View",
            icon: FileText,
            onClick: () => router.push(`/overview/billing/${invoice.id}`),
          }}
          items={[
            {
              label: invoice.status === "paid" ? "Mark pending" : "Mark paid",
              icon: invoice.status === "paid" ? Clock : CheckCircle2,
              onClick: () =>
                updateInvoiceMutation.mutate({
                  id: invoice.id,
                  updates:
                    invoice.status === "paid"
                      ? { status: "pending", paidDate: null }
                      : { status: "paid", paidDate: new Date().toISOString() },
                }),
            },
            {
              label: "Download PDF",
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
      label: "Status",
      options: [
        { value: "paid", label: "Paid" },
        { value: "pending", label: "Pending" },
        { value: "overdue", label: "Overdue" },
      ],
      filterFn: (invoice: Invoice, value: string) => invoice.status === value,
    },
  ];

  return (
    <div className="space-y-6 pb-8 sm:space-y-8">
      <PageHeader
        title="Billing & Invoices"
        description="Manage billing calculations and generate invoices for utility usage."
        actions={
          <>
            <div className="text-xs text-muted-foreground">
              {selectedInvoiceIds.size} selected
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintSelected}
              disabled={isExporting || !selectionReady}
              title={!selectionReady ? "Select invoices first" : undefined}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print 4/page
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPng}
              disabled={isExporting || !selectionReady}
              title={!selectionReady ? "Select invoices first" : undefined}
            >
              <Image className="mr-2 h-4 w-4" />
              Export PNG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={isExporting || !selectionReady}
              title={!selectionReady ? "Select invoices first" : undefined}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedInvoiceIds(new Set())}
              disabled={selectedInvoiceIds.size === 0}
            >
              Clear
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {invoices.length} invoices this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(paidAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {paidInvoices.length} paid invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
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
              pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(overdueAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter((inv) => inv.status === "overdue").length}{" "}
              overdue
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState message="Loading invoices..." />
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8 text-muted-foreground" />}
              title="No invoices yet"
              description="Invoices will appear here once you process meter readings"
              actionLabel="View Readings"
              actionHref="/overview/readings"
            />
          ) : (
            <DataTable
              data={invoices}
              columns={columns}
              searchPlaceholder="Search by invoice #, tenant, room, or period..."
              filters={filters}
              pageSize={10}
              forcePagination
              getRowId={(invoice) => invoice.id}
              selectedRowIds={selectedInvoiceIds}
              onSelectionChange={setSelectedInvoiceIds}
              selectionLabel="Select invoice"
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
              <p>No invoices selected for printing</p>
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
            className="w-[520px]"
          >
            <PrintInvoiceCard invoice={invoice} />
          </div>
        ))}
      </div>
    </div>
  );
}
