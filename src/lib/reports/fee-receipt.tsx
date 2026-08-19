import { Text, View } from "@react-pdf/renderer";
import { PdfPage, PdfRow, styles } from "@/lib/reports/pdf-document";

export type FeeReceiptData = {
  instituteName: string;
  receiptNumber: string;
  paymentDate: string;
  studentName: string;
  rollNumber: string;
  feeTitle: string | null;
  amount: number;
  paymentMethod: string;
  notes: string | null;
  recordedByName: string;
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  "bank-transfer": "Bank transfer",
  card: "Card",
  cheque: "Cheque",
  other: "Other",
};

export function FeeReceiptDocument({ data }: { data: FeeReceiptData }) {
  return (
    <PdfPage
      instituteName={data.instituteName}
      docTitle="Payment Receipt"
      docMeta={data.receiptNumber}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Student</Text>
        <PdfRow label="Name" value={data.studentName} />
        {data.rollNumber ? <PdfRow label="Roll number" value={data.rollNumber} /> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <PdfRow label="Receipt number" value={data.receiptNumber} />
        <PdfRow label="Payment date" value={data.paymentDate} />
        <PdfRow label="Fee" value={data.feeTitle ?? "Ad-hoc payment"} />
        <PdfRow
          label="Payment method"
          value={PAYMENT_METHOD_LABELS[data.paymentMethod] ?? data.paymentMethod}
        />
        <PdfRow label="Amount paid" value={data.amount.toFixed(2)} />
        {data.notes ? <PdfRow label="Notes" value={data.notes} /> : null}
      </View>

      <View style={styles.section}>
        <PdfRow label="Recorded by" value={data.recordedByName} />
      </View>
    </PdfPage>
  );
}
