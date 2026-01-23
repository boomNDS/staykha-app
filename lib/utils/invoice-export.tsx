import { pdf } from "@react-pdf/renderer";
import type { Invoice } from "@/lib/types";
import type { AdminSettings } from "@/lib/types";
import { InvoicePDFDocument } from "@/components/billing/invoice-pdf";

/**
 * Generate filename for invoice export
 */
export function generateInvoiceFilename(
  invoices: Invoice[],
  extension: "pdf" | "png" = "pdf",
): string {
  if (invoices.length === 0) {
    return `invoice.${extension}`;
  }

  if (invoices.length === 1) {
    const invoice = invoices[0];
    return `invoice-${invoice.invoiceNumber || invoice.id}.${extension}`;
  }

  // Multiple invoices: join invoice numbers with dashes
  const identifiers = invoices.map(
    (inv) => inv.invoiceNumber || inv.id,
  );
  return `invoices-${identifiers.join("-")}.${extension}`;
}

/**
 * Export invoices as PDF
 */
export async function exportInvoicesAsPdf(
  invoices: Invoice[],
  settings: AdminSettings | null,
  options: {
    gridLayout?: boolean;
    onSuccess?: (filename: string) => void;
    onError?: (error: Error) => void;
  } = {},
): Promise<void> {
  const { gridLayout = false, onSuccess, onError } = options;

  if (!invoices || invoices.length === 0) {
    const error = new Error("No invoices provided for export");
    onError?.(error);
    throw error;
  }

  try {
    // Create PDF document
    const doc = (
      <InvoicePDFDocument
        invoices={invoices}
        settings={settings}
        gridLayout={gridLayout}
      />
    );

    // Generate PDF blob
    const asPdf = pdf(doc as any);
    const blob = await asPdf.toBlob();

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = generateInvoiceFilename(invoices, "pdf");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up URL after a short delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);

    onSuccess?.(link.download);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);
    throw err;
  }
}

/**
 * Print invoices as PDF (opens in new window for printing)
 */
export async function printInvoicesAsPdf(
  invoices: Invoice[],
  settings: AdminSettings | null,
  options: {
    gridLayout?: boolean;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  } = {},
): Promise<void> {
  const { gridLayout = false, onSuccess, onError } = options;

  if (!invoices || invoices.length === 0) {
    const error = new Error("No invoices provided for printing");
    onError?.(error);
    throw error;
  }

  try {
    // Create PDF document
    const doc = (
      <InvoicePDFDocument
        invoices={invoices}
        settings={settings}
        gridLayout={gridLayout}
      />
    );

    // Generate PDF blob
    const asPdf = pdf(doc as any);
    const blob = await asPdf.toBlob();

    // Open PDF in new tab for printing
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank");

    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }

    // Clean up URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 5000);

    onSuccess?.();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);
    throw err;
  }
}
