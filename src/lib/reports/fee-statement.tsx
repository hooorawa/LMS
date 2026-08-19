import { Text, View } from "@react-pdf/renderer";
import { PdfPage, PdfRow, styles } from "@/lib/reports/pdf-document";

export type FeeStatementRow = {
  title: string;
  amount: number;
  discount: number;
  paid: number;
  balance: number;
  dueDate: string;
};

export type FeeStatementData = {
  instituteName: string;
  studentName: string;
  rollNumber: string;
  generatedDate: string;
  totalDue: number;
  totalPaid: number;
  balance: number;
  fees: FeeStatementRow[];
};

export function FeeStatementDocument({ data }: { data: FeeStatementData }) {
  return (
    <PdfPage instituteName={data.instituteName} docTitle="Fee Statement" docMeta={data.generatedDate}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Student</Text>
        <PdfRow label="Name" value={data.studentName} />
        {data.rollNumber ? <PdfRow label="Roll number" value={data.rollNumber} /> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <PdfRow label="Total due after concessions" value={data.totalDue.toFixed(2)} />
        <PdfRow label="Total paid" value={data.totalPaid.toFixed(2)} />
        <PdfRow label="Outstanding balance" value={data.balance.toFixed(2)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fees</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.tableCell}>Fee</Text>
            <Text style={styles.tableCellRight}>Amount</Text>
            <Text style={styles.tableCellRight}>Discount</Text>
            <Text style={styles.tableCellRight}>Paid</Text>
            <Text style={styles.tableCellRight}>Balance</Text>
          </View>
          {data.fees.map((fee) => (
            <View style={styles.tableRow} key={fee.title}>
              <Text style={styles.tableCell}>{fee.title}</Text>
              <Text style={styles.tableCellRight}>{fee.amount.toFixed(2)}</Text>
              <Text style={styles.tableCellRight}>{fee.discount.toFixed(2)}</Text>
              <Text style={styles.tableCellRight}>{fee.paid.toFixed(2)}</Text>
              <Text style={styles.tableCellRight}>{fee.balance.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </View>
    </PdfPage>
  );
}
