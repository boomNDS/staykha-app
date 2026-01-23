import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { Invoice } from "@/lib/types";
import type { AdminSettings } from "@/lib/types";
import { WaterBillingMode } from "@/lib/types";

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
    padding: 40,
    backgroundColor: "#ffffff",
    fontFamily: "THSarabunNew",
  },
  header: {
    textAlign: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    fontFamily: "THSarabunNew",
  },
  roomNumber: {
    fontSize: 20,
    fontWeight: "normal",
    marginBottom: 4,
    fontFamily: "THSarabunNew",
  },
  date: {
    fontSize: 16,
    color: "#000000",
    marginBottom: 20,
    fontFamily: "THSarabunNew",
  },
  table: {
    border: "1px solid #e2e8f0",
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottom: "1px solid #cbd5e1",
    padding: 10,
  },
  tableHeaderCellFirst: {
    flex: 1,
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "THSarabunNew",
    textAlign: "left",
  },
  tableHeaderCellCenter: {
    flex: 1,
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "THSarabunNew",
    textAlign: "center",
  },
  tableHeaderCellLast: {
    flex: 1,
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "THSarabunNew",
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #e2e8f0",
    padding: 10,
    backgroundColor: "#ffffff",
  },
  tableCellLeft: {
    flex: 1,
    fontSize: 14,
    fontFamily: "THSarabunNew",
    textAlign: "left",
  },
  tableCellCenter: {
    flex: 1,
    fontSize: 14,
    fontFamily: "THSarabunNew",
    textAlign: "center",
  },
  tableCellRight: {
    flex: 1,
    fontSize: 14,
    fontFamily: "THSarabunNew",
    textAlign: "right",
  },
  footer: {
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: "THSarabunNew",
  },
  footerTextRed: {
    fontSize: 14,
    marginBottom: 8,
    color: "#dc2626",
    fontFamily: "THSarabunNew",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTop: "1px solid #e2e8f0",
  },
  footerLabel: {
    fontSize: 14,
    fontFamily: "THSarabunNew",
  },
  footerValue: {
    fontSize: 14,
    fontFamily: "THSarabunNew",
  },
});

// Styles for 4 invoices per page (2x2 grid)
const gridPageStyles = StyleSheet.create({
  page: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#ffffff",
    padding: 16,
    fontFamily: "THSarabunNew",
  },
  invoiceCard: {
    width: "48%",
    height: "48%",
    padding: 12,
    marginBottom: 8,
    marginRight: 8,
    border: "1px solid #e2e8f0",
    position: "relative",
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
    border: "1px solid #e2e8f0",
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottom: "1px solid #cbd5e1",
    padding: 4,
  },
  tableHeaderCellFirst: {
    flex: 1,
    fontSize: 8,
    fontWeight: "bold",
    fontFamily: "THSarabunNew",
    textAlign: "left",
  },
  tableHeaderCellCenter: {
    flex: 1,
    fontSize: 8,
    fontWeight: "bold",
    fontFamily: "THSarabunNew",
    textAlign: "center",
  },
  tableHeaderCellLast: {
    flex: 1,
    fontSize: 8,
    fontWeight: "bold",
    fontFamily: "THSarabunNew",
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #e2e8f0",
    padding: 4,
    backgroundColor: "#ffffff",
  },
  tableCellLeft: {
    flex: 1,
    fontSize: 8,
    fontFamily: "THSarabunNew",
    textAlign: "left",
  },
  tableCellCenter: {
    flex: 1,
    fontSize: 8,
    fontFamily: "THSarabunNew",
    textAlign: "center",
  },
  tableCellRight: {
    flex: 1,
    fontSize: 8,
    fontFamily: "THSarabunNew",
    textAlign: "right",
  },
  footer: {
    marginTop: 8,
  },
  footerText: {
    fontSize: 7,
    marginBottom: 3,
    fontFamily: "THSarabunNew",
  },
  footerTextRed: {
    fontSize: 7,
    marginBottom: 3,
    color: "#dc2626",
    fontFamily: "THSarabunNew",
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
  },
  footerValue: {
    fontSize: 7,
    fontFamily: "THSarabunNew",
  },
});

interface InvoicePDFProps {
  invoices: Invoice[];
  settings?: AdminSettings | null;
  gridLayout?: boolean; // If true, render 4 invoices per page (2x2 grid)
}

export function InvoicePDFDocument({ invoices, settings, gridLayout = false }: InvoicePDFProps) {
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

  const formatCurrency = (amount: number | string | null | undefined): string => {
    if (amount === null || amount === undefined) return "฿0.00";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return "฿0.00";
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
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
  const renderInvoice = (invoice: Invoice, styles: typeof singlePageStyles) => {
    // Get room number from multiple possible sources
    const roomLabel = 
      invoice.room?.roomNumber || 
      invoice.roomNumber || 
      (invoice.room as any)?.roomNumber ||
      invoice.roomId || 
      "—";
    const waterReading = invoice.readings?.find(
      (reading) => {
        const type = String(reading?.meterType || "").toLowerCase();
        return type === "water";
      },
    );
    const electricReading = invoice.readings?.find(
      (reading) => {
        const type = String(reading?.meterType || "").toLowerCase();
        return type === "electric" || type === "electricity";
      },
    );
    const roomRent = invoice.roomRent ?? invoice.room?.monthlyRent ?? null;
    const waterSubtotal = invoice.waterSubtotal ?? invoice.waterAmount ?? 0;
    const electricSubtotal = invoice.electricSubtotal ?? invoice.electricAmount ?? 0;
    const subtotal = invoice.subtotal ?? waterSubtotal + electricSubtotal + (roomRent ?? 0);
    const tax = invoice.tax ?? 0;
    const total = invoice.total ?? subtotal + tax;

    const labelInvoice = settings?.labelInvoice || "ใบแจ้งหนี้";
    const labelRoomRent = settings?.labelRoomRent || "ค่าเช่าห้อง";
    const labelWater = settings?.labelWater || "ค่าน้ำ";
    const labelElectricity = settings?.labelElectricity || "ค่าไฟ";

    // Get meter readings
    const waterPrevious = waterReading?.previousReading ?? null;
    const waterCurrent = waterReading?.currentReading ?? null;
    const electricPrevious = electricReading?.previousReading ?? null;
    const electricCurrent = electricReading?.currentReading ?? null;

    // Format meter readings
    const formatMeterReading = (value: number | null | undefined): string => {
      if (value === null || value === undefined) return "—";
      return value.toString();
    };

    return (
      <View key={invoice.id} style={gridLayout ? gridPageStyles.invoiceCard : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{labelInvoice}</Text>
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
          {roomRent !== null && (
            <View style={styles.tableRow}>
              <Text style={styles.tableCellLeft}>{labelRoomRent}</Text>
              <Text style={styles.tableCellCenter}>—</Text>
              <Text style={styles.tableCellCenter}>—</Text>
              <Text style={styles.tableCellRight}>{formatCurrency(roomRent)}</Text>
            </View>
          )}

          {/* Water Row */}
          {waterSubtotal > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.tableCellLeft}>{labelWater}</Text>
              <Text style={styles.tableCellCenter}>{formatMeterReading(waterPrevious)}</Text>
              <Text style={styles.tableCellCenter}>{formatMeterReading(waterCurrent)}</Text>
              <Text style={styles.tableCellRight}>{formatCurrency(waterSubtotal)}</Text>
            </View>
          )}

          {/* Electricity Row */}
          {(typeof electricSubtotal === "number" ? electricSubtotal : Number.parseFloat(String(electricSubtotal)) || 0) > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.tableCellLeft}>{labelElectricity}</Text>
              <Text style={styles.tableCellCenter}>{formatMeterReading(electricPrevious)}</Text>
              <Text style={styles.tableCellCenter}>{formatMeterReading(electricCurrent)}</Text>
              <Text style={styles.tableCellRight}>{formatCurrency(electricSubtotal)}</Text>
            </View>
          )}

          {/* Subtotal Row */}
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLeft}>รวมย่อย</Text>
            <Text style={styles.tableCellCenter}></Text>
            <Text style={styles.tableCellCenter}></Text>
            <Text style={styles.tableCellRight}>{formatCurrency(subtotal)}</Text>
          </View>

          {/* Tax Row */}
          {tax > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.tableCellLeft}>ภาษีมูลค่าเพิ่ม ({settings?.taxRate || 7}%)</Text>
              <Text style={styles.tableCellCenter}></Text>
              <Text style={styles.tableCellCenter}></Text>
              <Text style={styles.tableCellRight}>{formatCurrency(tax)}</Text>
            </View>
          )}

          {/* Total Row */}
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLeft}>จำนวนเงินรวม</Text>
            <Text style={styles.tableCellCenter}>—</Text>
            <Text style={styles.tableCellCenter}>—</Text>
            <Text style={styles.tableCellRight}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            วันสุดท้ายที่ต้องชำระ : ภายในวันที่ {settings?.dueDateDayOfMonth || 5} ของทุกเดือน
          </Text>
          <Text style={styles.footerTextRed}>
            หากเกินกำหนด ชำระค่าปรับวันละ {formatCurrency(settings?.latePaymentPenaltyPerDay || 100)}
          </Text>

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

          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>เลขที่ใบแจ้งหนี้</Text>
            <Text style={styles.footerValue}>
              {invoice.invoiceNumber || "—"}
            </Text>
          </View>
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
            {chunk.map((invoice) => renderInvoice(invoice, gridPageStyles))}
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
