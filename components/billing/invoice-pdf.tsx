import { Document, Image, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { Invoice } from "@/lib/types";
import type { AdminSettings } from "@/lib/types";
import {
  calculateInvoiceAmounts,
  formatMeterReading,
  getElectricReading,
  getInvoiceLabels,
  getInvoiceMetadata,
  getInvoiceRoomLabel,
  getWaterReading,
} from "@/lib/utils/invoice-helpers";

const getBankLogoMeta = (bankName?: string | null) => {
  switch (bankName) {
    case "ธนาคารกสิกรไทย":
      return { logo: "/banks/kbank.svg", color: "#16a34a" };
    case "ธนาคารกรุงไทย":
      return { logo: "/banks/ktb.svg", color: "#2563eb" };
    case "ธนาคารกรุงเทพ":
      return { logo: "/banks/bbl.svg", color: "#1d4ed8" };
    case "ธนาคารไทยพาณิชย์":
      return { logo: "/banks/scb.svg", color: "#6d28d9" };
    case "ธนาคารกรุงศรีอยุธยา":
      return { logo: "/banks/bay.svg", color: "#f59e0b" };
    case "ธนาคารทหารไทยธนชาต":
      return { logo: "/banks/ttb.svg", color: "#0ea5e9" };
    case "ธนาคารออมสิน":
      return { logo: "/banks/gsb.svg", color: "#ec4899" };
    default:
      return null;
  }
};

const PROMPTPAY_LOGO = "/banks/promptpay.svg";

// Register Thai font - using THSarabunNew font from local files
// Font files located in: public/fonts/
// Available fonts:
//   - THSarabunNew.ttf (Regular/Normal)
//   - THSarabunNew Bold.ttf (Bold)
//   - THSarabunNew Italic.ttf (Italic)
//   - THSarabunNew BoldItalic.ttf (Bold Italic)
try {
  Font.register({
    family: "THSarabunNew",
    fonts: [
      {
        src: "/fonts/THSarabunNew.ttf",
        fontWeight: "normal",
      },
      {
        src: "/fonts/THSarabunNew Bold.ttf",
        fontWeight: "bold",
      },
    ],
  });
} catch (error) {
  // Font might already be registered, ignore error
  console.warn("Font registration warning:", error);
}

// Styles for single invoice per page
const singlePageStyles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: "#ffffff",
    fontFamily: "THSarabunNew",
  },
  header: {
    textAlign: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 6,
    fontFamily: "THSarabunNew",
  },
  roomNumber: {
    fontSize: 20,
    fontWeight: "normal",
    marginBottom: 3,
    fontFamily: "THSarabunNew",
  },
  date: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 12,
    fontFamily: "THSarabunNew",
  },
  table: {
    border: "2px solid #cbd5e1",
    borderRadius: 6,
    marginBottom: 12,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottom: "1px solid #cbd5e1",
    padding: 8,
  },
  tableHeaderCellFirst: {
    flex: 2.5,
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "THSarabunNew",
    textAlign: "left",
    color: "#334155",
  },
  tableHeaderCellCenter: {
    flex: 1.8,
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "THSarabunNew",
    textAlign: "center",
    color: "#334155",
  },
  tableHeaderCellLast: {
    flex: 3.9,
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "THSarabunNew",
    textAlign: "right",
    color: "#334155",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #e2e8f0",
    padding: 8,
    backgroundColor: "#ffffff",
  },
  tableRowTotal: {
    flexDirection: "row",
    borderBottom: "1px solid #e2e8f0",
    padding: 8,
    backgroundColor: "#f8fafc",
  },
  tableCellLeft: {
    flex: 2.5,
    fontSize: 14,
    fontFamily: "THSarabunNew",
    textAlign: "left",
    color: "#0f172a",
  },
  tableCellCenter: {
    flex: 1.8,
    fontSize: 14,
    fontFamily: "THSarabunNew",
    textAlign: "center",
    color: "#475569",
  },
  tableCellRight: {
    flex: 3.9,
    fontSize: 14,
    fontFamily: "THSarabunNew",
    textAlign: "right",
    color: "#0f172a",
    fontWeight: "bold",
  },
  footer: {
    marginTop: 12,
    paddingTop: 10,
    borderTop: "2px solid #cbd5e1",
  },
  footerPayment: {
    marginBottom: 8,
  },
  footerText: {
    fontSize: 14,
    marginBottom: 3,
    fontFamily: "THSarabunNew",
    color: "#0f172a",
    fontWeight: "bold",
  },
  footerTextRed: {
    fontSize: 14,
    marginBottom: 6,
    color: "#dc2626",
    fontFamily: "THSarabunNew",
    fontWeight: "bold",
  },
  footerBankInfo: {
    marginTop: 6,
  },
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  bankLogo: {
    width: 18,
    height: 18,
  },
  bankLogoBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  promptpayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  promptpayQr: {
    width: 70,
    height: 70,
  },
  footerBankText: {
    fontSize: 14,
    marginBottom: 2,
    fontFamily: "THSarabunNew",
    color: "#334155",
    fontWeight: "normal",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTop: "1px solid #e2e8f0",
  },
  footerLabel: {
    fontSize: 14,
    fontFamily: "THSarabunNew",
    color: "#64748b",
  },
  footerValue: {
    fontSize: 14,
    fontFamily: "THSarabunNew",
    color: "#334155",
    fontWeight: "bold",
  },
  footerValueMono: {
    fontSize: 14,
    fontFamily: "THSarabunNew",
    color: "#334155",
    fontWeight: "bold",
  },
});

// Styles for 4 invoices per page (2x2 grid)
const gridPageStyles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 16,
    fontFamily: "THSarabunNew",
  },
  invoiceRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 16,
  },
  invoiceCard: {
    width: "48%",
    padding: 10,
    marginRight: "2%",
    marginLeft: "1%",
    border: "1px solid #e2e8f0",
    position: "relative",
    minHeight: 280,
  },
  header: {
    textAlign: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    fontFamily: "THSarabunNew",
  },
  roomNumber: {
    fontSize: 12,
    fontWeight: "normal",
    marginBottom: 2,
    fontFamily: "THSarabunNew",
  },
  date: {
    fontSize: 10,
    color: "#000000",
    marginBottom: 8,
    fontFamily: "THSarabunNew",
  },
  table: {
    border: "2px solid #cbd5e1",
    borderRadius: 6,
    marginBottom: 8,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottom: "1px solid #cbd5e1",
    padding: 4,
  },
  tableHeaderCellFirst: {
    flex: 2.5,
    fontSize: 8,
    fontWeight: "bold",
    fontFamily: "THSarabunNew",
    textAlign: "left",
    color: "#334155",
  },
  tableHeaderCellCenter: {
    flex: 1.8,
    fontSize: 8,
    fontWeight: "bold",
    fontFamily: "THSarabunNew",
    textAlign: "center",
    color: "#334155",
  },
  tableHeaderCellLast: {
    flex: 3.9,
    fontSize: 8,
    fontWeight: "bold",
    fontFamily: "THSarabunNew",
    textAlign: "right",
    color: "#334155",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #e2e8f0",
    padding: 4,
    backgroundColor: "#ffffff",
  },
  tableRowTotal: {
    flexDirection: "row",
    borderBottom: "1px solid #e2e8f0",
    padding: 4,
    backgroundColor: "#f8fafc",
  },
  tableCellLeft: {
    flex: 2.5,
    fontSize: 8,
    fontFamily: "THSarabunNew",
    textAlign: "left",
    color: "#0f172a",
  },
  tableCellCenter: {
    flex: 1.8,
    fontSize: 8,
    fontFamily: "THSarabunNew",
    textAlign: "center",
    color: "#475569",
  },
  tableCellRight: {
    flex: 3.9,
    fontSize: 8,
    fontFamily: "THSarabunNew",
    textAlign: "right",
    color: "#0f172a",
    fontWeight: "bold",
  },
  footer: {
    marginTop: 8,
    paddingTop: 8,
    borderTop: "2px solid #cbd5e1",
  },
  footerPayment: {
    marginBottom: 6,
  },
  footerText: {
    fontSize: 7,
    marginBottom: 2,
    fontFamily: "THSarabunNew",
    color: "#0f172a",
    fontWeight: "bold",
  },
  footerTextRed: {
    fontSize: 7,
    marginBottom: 4,
    color: "#dc2626",
    fontFamily: "THSarabunNew",
    fontWeight: "bold",
  },
  footerBankInfo: {
    marginTop: 4,
  },
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  bankLogo: {
    width: 12,
    height: 12,
  },
  bankLogoBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  promptpayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  promptpayQr: {
    width: 48,
    height: 48,
  },
  footerBankText: {
    fontSize: 7,
    marginBottom: 1,
    fontFamily: "THSarabunNew",
    color: "#334155",
    fontWeight: "normal",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 4,
    borderTop: "1px solid #e2e8f0",
  },
  footerLabel: {
    fontSize: 7,
    fontFamily: "THSarabunNew",
    color: "#64748b",
  },
  footerValue: {
    fontSize: 7,
    fontFamily: "THSarabunNew",
    color: "#334155",
    fontWeight: "bold",
  },
  footerValueMono: {
    fontSize: 7,
    fontFamily: "THSarabunNew",
    color: "#334155",
    fontWeight: "bold",
  },
});

interface InvoicePDFProps {
  invoices: Invoice[];
  settings?: AdminSettings | null;
  gridLayout?: boolean; // If true, render 4 invoices per page (2x2 grid)
  promptpayQrDataUrl?: string | null;
}

export function InvoicePDFDocument({
  invoices,
  settings,
  gridLayout = false,
  promptpayQrDataUrl = null,
}: InvoicePDFProps) {
  // Validate and filter out any invalid invoices
  const validInvoices = (invoices || []).filter((inv): inv is Invoice => inv != null && typeof inv === "object" && "id" in inv);
  
  if (validInvoices.length === 0) {
    return (
      <Document>
        <Page size="A4" style={gridLayout ? gridPageStyles.page : singlePageStyles.page}>
          <View style={{ padding: 20 }}>
            <Text style={{ fontFamily: "THSarabunNew" }}>ไม่มีข้อมูลใบแจ้งหนี้</Text>
          </View>
        </Page>
      </Document>
    );
  }

  const formatCurrency = (amount: number | string | null | undefined, currency: string = "THB"): string => {
    if (amount === null || amount === undefined) return "฿0.00";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return "฿0.00";
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatDateThai = (date: string | Date | null | undefined): string => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear() + 543; // Convert to Buddhist calendar
    return `${day}/${month}/${year}`;
  };

  const formatDateThaiLong = (date: string | Date | null | undefined): string => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("th-TH", {
      month: "long",
      year: "numeric",
    });
  };

  // Render a single invoice
  const renderInvoice = (invoice: Invoice, styles: typeof singlePageStyles | typeof gridPageStyles) => {
    // Use shared utility functions
    const roomLabel = getInvoiceRoomLabel(invoice);
    const waterReading = getWaterReading(invoice);
    const electricReading = getElectricReading(invoice);
    const { roomRent, waterSubtotal, electricSubtotal, subtotal, tax, total } =
      calculateInvoiceAmounts(invoice);
    const { isWaterFixed, taxRate } = getInvoiceMetadata(invoice, settings);
    const labels = getInvoiceLabels(settings);
    const bankLogoMeta = getBankLogoMeta(settings?.bankName);
    const promptpayEnabled = Boolean(settings?.promptpayEnabled);
    const promptpayId = settings?.promptpayId || "";

    return (
      <View key={invoice.id}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{labels.invoice}</Text>
          <Text style={styles.roomNumber}>ห้องเลขที่ {roomLabel}</Text>
          <Text style={styles.date}>
            {formatDateThaiLong(invoice.issueDate || invoice.createdAt || new Date())}
          </Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderCellFirst}>รายการ</Text>
            <Text style={styles.tableHeaderCellCenter}>เลขมิเตอร์ก่อน</Text>
            <Text style={styles.tableHeaderCellCenter}>เลขมิเตอร์หลัง</Text>
            <Text style={styles.tableHeaderCellLast}>จำนวนเงินรวม</Text>
          </View>

          {/* Room Rent Row */}
          {roomRent && roomRent > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.tableCellLeft}>{labels.roomRent}</Text>
              <Text style={styles.tableCellCenter}>—</Text>
              <Text style={styles.tableCellCenter}>—</Text>
              <Text style={styles.tableCellRight}>{formatCurrency(roomRent, settings?.currency || "THB")}</Text>
            </View>
          )}

          {/* Water Row */}
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLeft}>
              {labels.water} {isWaterFixed ? "(ค่าบริการ)" : ""}
            </Text>
            <Text style={styles.tableCellCenter}>
              {isWaterFixed
                ? "—"
                : formatMeterReading(waterReading?.previousReading ?? null)}
            </Text>
            <Text style={styles.tableCellCenter}>
              {isWaterFixed
                ? "—"
                : formatMeterReading(waterReading?.currentReading ?? null)}
            </Text>
            <Text style={styles.tableCellRight}>{formatCurrency(waterSubtotal, settings?.currency || "THB")}</Text>
          </View>

          {/* Electricity Row */}
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLeft}>{labels.electricity}</Text>
            <Text style={styles.tableCellCenter}>
              {formatMeterReading(electricReading?.previousReading ?? null)}
            </Text>
            <Text style={styles.tableCellCenter}>
              {formatMeterReading(electricReading?.currentReading ?? null)}
            </Text>
            <Text style={styles.tableCellRight}>{formatCurrency(electricSubtotal, settings?.currency || "THB")}</Text>
          </View>

          {/* Subtotal Row */}
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLeft}>รวมย่อย</Text>
            <Text style={styles.tableCellCenter}></Text>
            <Text style={styles.tableCellCenter}></Text>
            <Text style={styles.tableCellRight}>{formatCurrency(subtotal, settings?.currency || "THB")}</Text>
          </View>

          {/* Tax Row */}
          {tax > 0 && taxRate > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.tableCellLeft}>ภาษีมูลค่าเพิ่ม ({taxRate}%)</Text>
              <Text style={styles.tableCellCenter}></Text>
              <Text style={styles.tableCellCenter}></Text>
              <Text style={styles.tableCellRight}>{formatCurrency(tax, settings?.currency || "THB")}</Text>
            </View>
          )}

          {/* Total Row */}
          <View style={styles.tableRowTotal}>
            <Text style={styles.tableCellLeft}>{labels.total}</Text>
            <Text style={styles.tableCellCenter}>—</Text>
            <Text style={styles.tableCellCenter}>—</Text>
            <Text style={styles.tableCellRight}>{formatCurrency(total, settings?.currency || "THB")}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Payment Instructions */}
          <View style={styles.footerPayment}>
            <Text style={styles.footerText}>
              วันสุดท้ายที่ต้องชำระ : ภายในวันที่ {settings?.dueDateDayOfMonth || 5} ของทุกเดือน
            </Text>
            {settings?.latePaymentPenaltyPerDay && settings.latePaymentPenaltyPerDay > 0 && (
              <Text style={styles.footerTextRed}>
                หากเกินกำหนด ชำระค่าปรับวันละ {formatCurrency(settings.latePaymentPenaltyPerDay, settings?.currency || "THB")}
              </Text>
            )}
          </View>

          {/* Banking Information */}
          {(settings?.bankName || settings?.bankAccountNumber || settings?.lineId) && (
            <View style={styles.footerBankInfo}>
              {(settings?.bankName || settings?.bankAccountNumber) && (
                <View style={styles.bankRow}>
                  {bankLogoMeta?.logo && (
                    <View
                      style={[
                        styles.bankLogoBox,
                        { backgroundColor: bankLogoMeta.color },
                      ]}
                    >
                      <Image style={styles.bankLogo} src={bankLogoMeta.logo} />
                    </View>
                  )}
                  <Text style={styles.footerBankText}>
                    {settings?.bankName && settings?.bankAccountNumber
                      ? `ชำระเงินได้ที่ ${settings.bankName} เลขบัญชี ${settings.bankAccountNumber}`
                      : settings?.bankName
                        ? `ชำระเงินได้ที่ ${settings.bankName}`
                        : settings?.bankAccountNumber
                          ? `เลขบัญชี ${settings.bankAccountNumber}`
                          : ""}
                  </Text>
                </View>
              )}
              {settings?.lineId && (
                <Text style={styles.footerBankText}>
                  ไอดีไลน์ {settings.lineId}
                </Text>
              )}
            </View>
          )}
          {promptpayEnabled && promptpayId && promptpayQrDataUrl && (
            <View style={styles.promptpayRow}>
              <Image style={styles.promptpayQr} src={promptpayQrDataUrl} />
              <View>
                <View style={styles.bankRow}>
                  <View style={[styles.bankLogoBox, { backgroundColor: "#0ea5e9" }]}>
                    <Image style={styles.bankLogo} src={PROMPTPAY_LOGO} />
                  </View>
                  <Text style={styles.footerBankText}>พร้อมเพย์ (PromptPay)</Text>
                </View>
                <Text style={styles.footerBankText}>รหัส: {promptpayId}</Text>
              </View>
            </View>
          )}

          {/* Invoice Details */}
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>วันที่ออกบิล</Text>
            <Text style={styles.footerValue}>
              {formatDateThai(invoice.issueDate || invoice.createdAt || new Date())}
            </Text>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>วันครบกำหนดชำระ</Text>
            <Text style={styles.footerValue}>
              {formatDateThai(invoice.dueDate)}
            </Text>
          </View>

          {invoice.invoiceNumber && (
            <View style={styles.footerRow}>
              <Text style={styles.footerLabel}>เลขที่ใบแจ้งหนี้</Text>
              <Text style={styles.footerValueMono}>
                {invoice.invoiceNumber}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // If grid layout, chunk invoices into groups of 4
  if (gridLayout) {
    const chunkedInvoices: Invoice[][] = [];
    for (let i = 0; i < validInvoices.length; i += 4) {
      chunkedInvoices.push(validInvoices.slice(i, i + 4));
    }

    return (
      <Document>
        {chunkedInvoices.map((chunk, pageIndex) => (
          <Page key={pageIndex} size="A4" style={gridPageStyles.page}>
            {/* First row: 2 invoices */}
            <View style={gridPageStyles.invoiceRow}>
              {chunk.slice(0, 2).map((invoice, idx) => {
                const cardStyle = idx === 1 
                  ? { ...gridPageStyles.invoiceCard, marginRight: "1%", marginLeft: "2%" }
                  : { ...gridPageStyles.invoiceCard, marginLeft: "1%" };
                return (
                  <View key={invoice.id} style={cardStyle}>
                    {renderInvoice(invoice, gridPageStyles)}
                  </View>
                );
              })}
            </View>
            {/* Second row: 2 invoices */}
            {chunk.length > 2 && (
              <View style={gridPageStyles.invoiceRow}>
                {chunk.slice(2, 4).map((invoice, idx) => {
                  const cardStyle = idx === 1 
                    ? { ...gridPageStyles.invoiceCard, marginRight: "1%", marginLeft: "2%" }
                    : { ...gridPageStyles.invoiceCard, marginLeft: "1%" };
                  return (
                    <View key={invoice.id} style={cardStyle}>
                      {renderInvoice(invoice, gridPageStyles)}
                    </View>
                  );
                })}
              </View>
            )}
          </Page>
        ))}
      </Document>
    );
  }

  // Single invoice per page
  return (
    <Document>
      {validInvoices.map((invoice) => (
        <Page key={invoice.id} size="A4" style={singlePageStyles.page}>
          {renderInvoice(invoice, singlePageStyles)}
        </Page>
      ))}
    </Document>
  );
}
