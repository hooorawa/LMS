import { Text, View } from "@react-pdf/renderer";
import { PdfPage, PdfRow, styles } from "@/lib/reports/pdf-document";

export type ReportCardGradeRow = {
  title: string;
  score: number;
  maxScore: number;
  percent: number | null;
};

export type ReportCardData = {
  instituteName: string;
  studentName: string;
  rollNumber: string;
  className: string;
  academicYear: string;
  generatedDate: string;
  attendancePercent: number;
  overallPercent: number | null;
  grades: ReportCardGradeRow[];
};

export function ReportCardDocument({ data }: { data: ReportCardData }) {
  return (
    <PdfPage
      instituteName={data.instituteName}
      docTitle="Report Card"
      docMeta={data.generatedDate}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Student</Text>
        <PdfRow label="Name" value={data.studentName} />
        {data.rollNumber ? <PdfRow label="Roll number" value={data.rollNumber} /> : null}
        <PdfRow label="Class" value={data.className} />
        {data.academicYear ? <PdfRow label="Academic year" value={data.academicYear} /> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance</Text>
        <PdfRow label="Overall attendance" value={`${data.attendancePercent}%`} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Grades</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.tableCell}>Course / Subject</Text>
            <Text style={styles.tableCellRight}>Score</Text>
            <Text style={styles.tableCellRight}>Max</Text>
            <Text style={styles.tableCellRight}>Percent</Text>
          </View>
          {data.grades.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>No graded items yet.</Text>
              <Text style={styles.tableCellRight}>-</Text>
              <Text style={styles.tableCellRight}>-</Text>
              <Text style={styles.tableCellRight}>-</Text>
            </View>
          ) : (
            data.grades.map((grade) => (
              <View style={styles.tableRow} key={grade.title}>
                <Text style={styles.tableCell}>{grade.title}</Text>
                <Text style={styles.tableCellRight}>{grade.score.toFixed(1)}</Text>
                <Text style={styles.tableCellRight}>{grade.maxScore.toFixed(1)}</Text>
                <Text style={styles.tableCellRight}>
                  {grade.percent !== null ? `${grade.percent.toFixed(1)}%` : "-"}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={styles.section}>
        <PdfRow
          label="Overall percentage"
          value={data.overallPercent !== null ? `${data.overallPercent.toFixed(1)}%` : "-"}
        />
      </View>
    </PdfPage>
  );
}
