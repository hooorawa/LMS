import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  ClipboardCheck,
  BarChart3,
  Megaphone,
  Settings,
  Building2,
  FileText,
  Wallet,
  BriefcaseBusiness,
  BadgePercent,
  Upload,
  TrendingDown,
  TrendingUp,
  Layers,
  CreditCard,
  ScrollText,
  HeartPulse,
  SlidersHorizontal,
  CalendarDays,
  History,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  group?: string;
  staffPermission?: string;
};

export const INSTITUTE_ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Overview" },
  { label: "Calendar", href: "/calendar", icon: CalendarDays, group: "Overview" },
  { label: "Operations", href: "/operations", icon: BriefcaseBusiness, group: "Overview" },
  { label: "Reports", href: "/reports", icon: BarChart3, group: "Overview" },
  { label: "Terms", href: "/terms", icon: CalendarDays, group: "Academics" },
  { label: "Staff", href: "/staff", icon: GraduationCap, group: "Academics" },
  { label: "Students", href: "/students", icon: Users, group: "Academics" },
  { label: "Classes", href: "/classes", icon: BookOpen, group: "Academics" },
  { label: "Subjects", href: "/subjects", icon: ClipboardCheck, group: "Academics" },
  { label: "Enrollments", href: "/enrollments", icon: ClipboardCheck, group: "Academics" },
  { label: "Attendance", href: "/attendance", icon: ClipboardCheck, group: "Operations" },
  { label: "Exams", href: "/exams", icon: FileText, group: "Operations" },
  { label: "Fees", href: "/fees", icon: Wallet, group: "Operations" },
  { label: "Payment Desk", href: "/payment-desk", icon: Wallet, group: "Operations" },
  { label: "Salary", href: "/salary", icon: Wallet, group: "Finance" },
  { label: "Commissions", href: "/commissions", icon: Wallet, group: "Finance" },
  { label: "Concessions", href: "/concessions", icon: BadgePercent, group: "Finance" },
  { label: "Expenses", href: "/expenses", icon: TrendingDown, group: "Finance" },
  { label: "Income", href: "/income", icon: TrendingUp, group: "Finance" },
  { label: "Bulk Imports", href: "/imports", icon: Upload, group: "System" },
  { label: "Audit History", href: "/audit-history", icon: History, group: "System" },
  { label: "Announcements", href: "/announcements", icon: Megaphone, group: "Engage" },
  { label: "Settings", href: "/settings", icon: Settings, group: "System" },
];

export const INSTITUTE_STAFF_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Overview", staffPermission: "dashboard" },
  { label: "Calendar", href: "/calendar", icon: CalendarDays, group: "Overview", staffPermission: "dashboard" },
  { label: "Workspace", href: "/workspace", icon: BriefcaseBusiness, group: "Overview", staffPermission: "classes" },
  { label: "Follow-ups", href: "/student-followups", icon: History, group: "Overview", staffPermission: "students" },
  { label: "Courses", href: "/courses", icon: BookOpen, group: "Teaching", staffPermission: "subjects" },
  { label: "Grading queue", href: "/grading", icon: BarChart3, group: "Teaching" },
  { label: "My Classes", href: "/my-classes", icon: BookOpen, group: "Teaching", staffPermission: "classes" },
  { label: "My Subjects", href: "/my-subjects", icon: ClipboardCheck, group: "Teaching", staffPermission: "subjects" },
  { label: "Students", href: "/students", icon: Users, disabled: true, group: "Teaching", staffPermission: "students" },
  { label: "Attendance", href: "/attendance", icon: ClipboardCheck, group: "Operations", staffPermission: "classes" },
  { label: "Exams", href: "/exams", icon: FileText, group: "Operations", staffPermission: "subjects" },
  { label: "Grades", href: "/grades", icon: BarChart3, group: "Operations", staffPermission: "subjects" },
  { label: "Announcements", href: "/announcements", icon: Megaphone, group: "Engage", staffPermission: "subjects" },
  { label: "Settings", href: "/settings", icon: Settings, group: "System" },
];

export const SUPER_ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Overview" },
  { label: "Institutes", href: "/institutes", icon: Building2, group: "Platform" },
  { label: "Plans", href: "/plans", icon: Layers, group: "Platform" },
  { label: "Billing", href: "/billing", icon: CreditCard, group: "Platform" },
  { label: "Audit log", href: "/audit-log", icon: ScrollText, group: "Platform" },
  { label: "Institute health", href: "/health", icon: HeartPulse, group: "Platform" },
  { label: "Platform settings", href: "/platform-settings", icon: SlidersHorizontal, group: "Platform" },
  { label: "Settings", href: "/settings", icon: Settings, group: "System" },
];

export const STUDENT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Overview" },
  { label: "My Courses", href: "/my-courses", icon: BookOpen, group: "Learning" },
  { label: "My Classes", href: "/my-classes", icon: BookOpen, group: "Learning" },
  { label: "Exam Registration", href: "/exam-registration", icon: FileText, group: "Progress" },
  { label: "Fees", href: "/fees", icon: Wallet, group: "Progress" },
  { label: "Deadlines", href: "/deadlines", icon: CalendarDays, group: "Progress" },
  { label: "Progress Center", href: "/progress", icon: BarChart3, group: "Progress" },
  { label: "My Subjects", href: "/my-subjects", icon: ClipboardCheck, group: "Learning" },
  { label: "Course Catalog", href: "/course-catalog", icon: BookOpen, group: "Learning" },
  { label: "Attendance", href: "/attendance", icon: ClipboardCheck, group: "Progress" },
  { label: "Grades", href: "/grades", icon: BarChart3, group: "Progress" },
  { label: "Exam Results", href: "/exam-results", icon: GraduationCap, group: "Progress" },
  { label: "Calendar", href: "/calendar", icon: CalendarDays, group: "Overview" },
  { label: "Announcements", href: "/announcements", icon: Megaphone, group: "Engage" },
  { label: "Settings", href: "/settings", icon: Settings, group: "System" },
];

export const NAV_BY_ROLE = {
  "institute-admin": INSTITUTE_ADMIN_NAV,
  "institute-staff": INSTITUTE_STAFF_NAV,
  "super-admin": SUPER_ADMIN_NAV,
  student: STUDENT_NAV,
} as const;

export type NavKey = keyof typeof NAV_BY_ROLE;

// Same lightness/chroma as the base sidebar accent, distinct hue per role so each
// dashboard reads as its own space while staying on the shared oklch token system.
export const NAV_ACCENT: Record<NavKey, string> = {
  "super-admin": "oklch(0.53 0.21 264)",
  "institute-admin": "oklch(0.53 0.19 300)",
  "institute-staff": "oklch(0.55 0.15 190)",
  student: "oklch(0.6 0.19 35)",
};
