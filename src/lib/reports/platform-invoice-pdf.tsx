import { Text, View } from "@react-pdf/renderer";
import { PdfPage, PdfRow, styles } from "@/lib/reports/pdf-document";

export type PlatformInvoicePdfData = {
  instituteName: string;
  instituteCode: string | null;
  invoiceNumber: string;
  planName: string;
  amount: number;
  currency: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  issuedAt: string;
  dueAt: string;
  paidAt: string | null;
  paymentMethod: string | null;
  receiptNumber: string | null;
  discountAmount: number;
  discountReason: string | null;
  notes: string | null;
};

export function PlatformInvoiceDocument({ data }: { data: PlatformInvoicePdfData }) {
  return (
    <PdfPage
      instituteName={data.instituteName}
      docTitle="Platform Invoice"
      docMeta={data.invoiceNumber}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Institute</Text>
        <PdfRow label="Name" value={data.instituteName} />
        {data.instituteCode ? <PdfRow label="Code" value={data.instituteCode} /> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invoice</Text>
        <PdfRow label="Invoice number" value={data.invoiceNumber} />
        <PdfRow label="Plan" value={data.planName} />
        <PdfRow label="Status" value={data.status} />
        <PdfRow label="Period" value={`${data.periodStart} - ${data.periodEnd}`} />
        <PdfRow label="Issued" value={data.issuedAt} />
        <PdfRow label="Due" value={data.dueAt} />
        {data.paidAt ? <PdfRow label="Paid" value={data.paidAt} /> : null}
        {data.paymentMethod ? <PdfRow label="Payment method" value={data.paymentMethod} /> : null}
        {data.receiptNumber ? <PdfRow label="Receipt" value={data.receiptNumber} /> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Amount</Text>
        <PdfRow label="Amount" value={`${data.currency} ${data.amount.toFixed(2)}`} />
        {data.discountAmount > 0 ? (
          <PdfRow
            label="Discount"
            value={`${data.currency} ${data.discountAmount.toFixed(2)}${
              data.discountReason ? ` - ${data.discountReason}` : ""
            }`}
          />
        ) : null}
      </View>

      {data.notes ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text>{data.notes}</Text>
        </View>
      ) : null}
    </PdfPage>
  );
}
