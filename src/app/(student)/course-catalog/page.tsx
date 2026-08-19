import { listPublishedCoursesForStudentCatalog } from "@/lib/data/course.data";
import { CourseCatalog } from "./course-catalog";

export default async function CourseCatalogPage() {
  const courses = await listPublishedCoursesForStudentCatalog();
  return <CourseCatalog courses={courses.map((course) => ({
    id: String(course._id), title: course.title, description: course.description ?? "",
    teacher: (course.teacherId as unknown as { name?: string } | null)?.name ?? "Unassigned",
    subject: (course.subjectId as unknown as { name?: string } | null)?.name ?? "General",
    subjectCode: (course.subjectId as unknown as { code?: string } | null)?.code ?? "",
  }))} />;
}
