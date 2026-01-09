"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Droplets, Loader2, Zap } from "lucide-react";
import * as React from "react";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { invoicesApi } from "@/lib/api-client";
import { useParams, useRouter } from "@/lib/router";
import type { Invoice } from "@/lib/types";
import { usePageTitle } from "@/lib/use-page-title";
import { formatCurrency } from "@/lib/utils";

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  usePageTitle(`Invoice ${invoiceId}`);

  const router = useRouter();

  const [isDownloading, setIsDownloading] = React.useState(false);

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
    setIsDownloading(true);
    try {
      const blob = await invoicesApi.downloadPdf(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice?.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (invoiceQuery.isLoading) {
    return <LoadingState fullScreen message="Loading invoice..." />;
  }

  if (!invoice) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <p className="text-muted-foreground">Invoice not found</p>
        <Button
          variant="link"
          onClick={() => router.push("/overview/billing")}
          className="mt-2"
        >
          Back to Billing
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
        title="Invoice Preview"
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
              {invoice.status === "paid" ? "Mark Pending" : "Mark Paid"}
            </Button>
            <Button onClick={handleDownloadPdf} disabled={isDownloading}>
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
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
                Utility Bill
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Billing Period: {invoice.billingPeriod}
              </p>
            </div>
            <Badge
              variant={invoice.status === "paid" ? "default" : "secondary"}
            >
              {invoice.status.toUpperCase()}
            </Badge>
          </div>
          {isWaterFixed && (
            <Badge variant="outline" className="mt-2">
              Water fixed fee
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-6 print:bg-white print:text-black">
          {/* Tenant & Room Info */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Bill To
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
                Property Details
              </p>
              <p className="font-semibold text-foreground">
                Room {invoice.room?.roomNumber || invoice.roomNumber}
              </p>
              <p className="text-sm text-muted-foreground">
                {invoice.room?.buildingName || "—"}, Floor{" "}
                {invoice.room?.floor ?? "—"}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-4 font-semibold text-foreground">
              Billing Summary
            </h3>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Item</th>
                    <th className="px-4 py-3 text-center font-medium">
                      Previous
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Current
                    </th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-4 py-3 font-medium text-foreground">
                      Room Rent
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
                        Water {isWaterFixed ? "(Fixed)" : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {isWaterFixed
                        ? "—"
                        : (waterReading?.previousReading ?? "—")}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {isWaterFixed
                        ? "—"
                        : (waterReading?.currentReading ?? "—")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {formatCurrency(waterSubtotal)}
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        Electric
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {electricReading?.previousReading ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {electricReading?.currentReading ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {formatCurrency(electricSubtotal)}
                    </td>
                  </tr>
                  <tr className="border-t bg-muted/20">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      Subtotal
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
                      Tax (7%)
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
                      Total Amount
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
                  <span>Water Usage</span>
                  <span className="font-mono text-foreground">
                    {isWaterFixed ? "Fixed fee" : `${waterConsumption} m³`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Water Rate</span>
                  <span className="font-mono text-foreground">
                    {isWaterFixed
                      ? formatCurrency(invoice.waterFixedFee ?? 0)
                      : `${formatCurrency(waterRate)}/m³`}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>Electric Usage</span>
                  <span className="font-mono text-foreground">
                    {electricConsumption} kWh
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Electric Rate</span>
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
                <span className="text-muted-foreground">Invoice Date</span>
                <span className="text-foreground">
                  {new Date(issuedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date</span>
                <span className="font-medium text-foreground">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </span>
              </div>
              {invoice.paidDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid Date</span>
                  <span className="text-foreground">
                    {new Date(invoice.paidDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
