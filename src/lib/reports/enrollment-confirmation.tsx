import { Text, View } from "@react-pdf/renderer";
import { PdfPage, PdfRow, styles } from "@/lib/reports/pdf-document";

export type EnrollmentConfirmationData = {
  instituteName: string;
  studentName: string;
  rollNumber: string;
  className: string;
  academicYear: string;
  activeCourseCount: number;
  generatedDate: string;
};

export function EnrollmentConfirmationDocument({
  data,
}: {
  data: EnrollmentConfirmationData;
}) {
  return (
    <PdfPage
      instituteName={data.instituteName}
      docTitle="Enrollment Confirmation"
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
        <Text style={styles.sectionTitle}>Enrollment</Text>
        <PdfRow label="Status" value="Active" />
        <PdfRow label="Active courses" value={String(data.activeCourseCount)} />
        <PdfRow label="Confirmed on" value={data.generatedDate} />
      </View>

      <View style={styles.section}>
        <Text>
          This confirms that the student named above is currently enrolled at this institute
          according to the records available in LearningMS.
        </Text>
      </View>
    </PdfPage>
  );
}
