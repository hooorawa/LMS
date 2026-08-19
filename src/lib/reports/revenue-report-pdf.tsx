import { Text, View } from "@react-pdf/renderer";
import { PdfPage, styles } from "@/lib/reports/pdf-document";

export type RevenueReportRow = {
  invoiceNumber: string;
  instituteName: string;
  amount: number;
  currency: string;
  status: string;
  dueAt: string;
};

export function RevenueReportDocument({
  rows,
  generatedAt,
}: {
  rows: RevenueReportRow[];
  generatedAt: string;
}) {
  return (
    <PdfPage instituteName="LearningMS Platform" docTitle="Revenue Report" docMeta={generatedAt}>
      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.tableCell}>Invoice</Text>
          <Text style={styles.tableCell}>Institute</Text>
          <Text style={styles.tableCellRight}>Amount</Text>
          <Text style={styles.tableCell}>Status</Text>
          <Text style={styles.tableCell}>Due</Text>
        </View>
        {rows.map((row) => (
          <View key={row.invoiceNumber} style={styles.tableRow}>
            <Text style={styles.tableCell}>{row.invoiceNumber}</Text>
            <Text style={styles.tableCell}>{row.instituteName}</Text>
            <Text style={styles.tableCellRight}>
              {row.currency} {row.amount.toFixed(2)}
            </Text>
            <Text style={styles.tableCell}>{row.status}</Text>
            <Text style={styles.tableCell}>{row.dueAt}</Text>
          </View>
        ))}
      </View>
    </PdfPage>
  );
}
