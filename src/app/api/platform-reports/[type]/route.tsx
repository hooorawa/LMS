import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { connectToDatabase } from "@/lib/db/connect";
import PlatformInvoiceModel from "@/models/PlatformInvoice";
import InstituteModel from "@/models/Institute";
import SubscriptionModel from "@/models/Subscription";
import UserModel from "@/models/User";
import { requireSession, requireRole } from "@/lib/tenant/scope";
import { toCsv } from "@/lib/reports/csv";
import { PlatformInvoiceDocument, type PlatformInvoicePdfData } from "@/lib/reports/platform-invoice-pdf";
import { RevenueReportDocument, type RevenueReportRow } from "@/lib/reports/revenue-report-pdf";

function displayStatus(status: string, dueAt: Date): string {
  return status === "pending" && dueAt < new Date() ? "overdue" : status;
}

async function handleInvoice(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing invoice id." }, { status: 400 });
  }

  const invoice = await PlatformInvoiceModel.findById(id)
    .populate("instituteId", "name code")
    .populate("planId", "name")
    .lean();
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  const institute = invoice.instituteId as unknown as { name?: string; code?: string } | null;
  const plan = invoice.planId as unknown as { name?: string } | null;

  const data: PlatformInvoicePdfData = {
    instituteName: institute?.name ?? "Unknown institute",
    instituteCode: institute?.code ?? null,
    invoiceNumber: invoice.invoiceNumber,
    planName: invoice.planNameSnapshot || plan?.name || "Unknown plan",
    amount: invoice.amount,
    currency: invoice.currency,
    status: displayStatus(invoice.status, invoice.dueAt),
    periodStart: new Date(invoice.periodStart).toLocaleDateString(),
    periodEnd: new Date(invoice.periodEnd).toLocaleDateString(),
    issuedAt: new Date(invoice.issuedAt).toLocaleDateString(),
    dueAt: new Date(invoice.dueAt).toLocaleDateString(),
    paidAt: invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : null,
    paymentMethod: invoice.paymentMethod ?? null,
    receiptNumber: invoice.receiptNumber ?? null,
    discountAmount: invoice.discountAmount ?? 0,
    discountReason: invoice.discountReason ?? null,
    notes: invoice.notes ?? null,
  };

  const buffer = await renderToBuffer(<PlatformInvoiceDocument data={data} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${data.invoiceNumber}.pdf"`,
    },
  });
}

async function handleInvoices(request: Request) {
  const format = new URL(request.url).searchParams.get("format") ?? "csv";

  const invoices = await PlatformInvoiceModel.find()
    .populate("instituteId", "name code")
    .sort({ issuedAt: -1, createdAt: -1 })
    .lean();

  const rows = invoices.map((invoice) => {
    const institute = invoice.instituteId as unknown as { name?: string } | null;
    return {
      invoiceNumber: invoice.invoiceNumber,
      instituteName: institute?.name ?? "Unknown institute",
      amount: invoice.amount,
      currency: invoice.currency,
      status: displayStatus(invoice.status, invoice.dueAt),
      dueAt: new Date(invoice.dueAt).toLocaleDateString(),
      issuedAt: new Date(invoice.issuedAt).toLocaleDateString(),
      discountAmount: invoice.discountAmount ?? 0,
      notes: invoice.notes ?? "",
    };
  });

  if (format === "pdf") {
    const pdfRows: RevenueReportRow[] = rows.map((row) => ({
      invoiceNumber: row.invoiceNumber,
      instituteName: row.instituteName,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      dueAt: row.dueAt,
    }));
    const buffer = await renderToBuffer(
      <RevenueReportDocument rows={pdfRows} generatedAt={new Date().toLocaleDateString()} />
    );
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoices-report.pdf"`,
      },
    });
  }

  const csv = toCsv(rows, [
    { key: "invoiceNumber", header: "Invoice" },
    { key: "instituteName", header: "Institute" },
    { key: "amount", header: "Amount" },
    { key: "currency", header: "Currency" },
    { key: "status", header: "Status" },
    { key: "issuedAt", header: "Issued" },
    { key: "dueAt", header: "Due" },
    { key: "discountAmount", header: "Discount" },
    { key: "notes", header: "Notes" },
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="invoices.csv"`,
    },
  });
}

async function handleInstituteBackup(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing institute id." }, { status: 400 });
  }

  const institute = await InstituteModel.findById(id).lean();
  if (!institute) {
    return NextResponse.json({ error: "Institute not found." }, { status: 404 });
  }

  const [subscription, invoices, admins] = await Promise.all([
    SubscriptionModel.findOne({ instituteId: id }).populate("planId", "name").lean(),
    PlatformInvoiceModel.find({ instituteId: id }).sort({ issuedAt: -1 }).lean(),
    UserModel.find({ instituteId: id, role: "institute-admin" })
      .select("name email phone status lastLoginAt createdAt")
      .lean(),
  ]);

  const plan = subscription?.planId as unknown as { name?: string } | null;

  const backup = {
    generatedAt: new Date().toISOString(),
    institute: {
      id: String(institute._id),
      name: institute.name,
      code: institute.code,
      status: institute.status,
      contactEmail: institute.contactEmail ?? null,
      phone: institute.phone ?? null,
      address: institute.address ?? null,
      createdAt: institute.createdAt,
    },
    subscription: subscription
      ? {
          planName: plan?.name ?? "Unknown plan",
          status: subscription.status,
          trialEndsAt: subscription.trialEndsAt ?? null,
          currentPeriodStart: subscription.currentPeriodStart ?? null,
          currentPeriodEnd: subscription.currentPeriodEnd ?? null,
          autoRenew: subscription.autoRenew,
        }
      : null,
    invoices: invoices.map((invoice) => ({
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      currency: invoice.currency,
      status: displayStatus(invoice.status, invoice.dueAt),
      issuedAt: invoice.issuedAt,
      dueAt: invoice.dueAt,
      paidAt: invoice.paidAt ?? null,
      discountAmount: invoice.discountAmount ?? 0,
    })),
    admins: admins.map((admin) => ({
      name: admin.name,
      email: admin.email,
      phone: admin.phone ?? null,
      status: admin.status,
      lastLoginAt: admin.lastLoginAt ?? null,
      createdAt: admin.createdAt,
    })),
  };

  return NextResponse.json(backup, {
    headers: {
      "Content-Disposition": `attachment; filename="institute-backup-${institute.code}.json"`,
    },
  });
}

async function handlePlatformBackup() {
  const institutes = await InstituteModel.find().lean();
  const [subscriptions, admins] = await Promise.all([
    SubscriptionModel.find().populate("planId", "name").lean(),
    UserModel.find({ role: "institute-admin" }).select("instituteId email").lean(),
  ]);

  const subscriptionByInstitute = new Map(
    subscriptions.map((subscription) => [String(subscription.instituteId), subscription])
  );
  const adminCountByInstitute = new Map<string, number>();
  for (const admin of admins) {
    const key = String(admin.instituteId);
    adminCountByInstitute.set(key, (adminCountByInstitute.get(key) ?? 0) + 1);
  }

  const backup = {
    generatedAt: new Date().toISOString(),
    institutes: institutes.map((institute) => {
      const key = String(institute._id);
      const subscription = subscriptionByInstitute.get(key);
      const plan = subscription?.planId as unknown as { name?: string } | null;
      return {
        id: key,
        name: institute.name,
        code: institute.code,
        status: institute.status,
        createdAt: institute.createdAt,
        planName: plan?.name ?? null,
        subscriptionStatus: subscription?.status ?? null,
        adminCount: adminCountByInstitute.get(key) ?? 0,
      };
    }),
  };

  return NextResponse.json(backup, {
    headers: {
      "Content-Disposition": `attachment; filename="platform-backup.json"`,
    },
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  await connectToDatabase();

  const { type } = await params;

  if (type === "invoice") {
    return handleInvoice(request);
  }

  if (type === "invoices") {
    return handleInvoices(request);
  }

  if (type === "institute-backup") {
    return handleInstituteBackup(request);
  }

  if (type === "platform-backup") {
    return handlePlatformBackup();
  }

  return NextResponse.json({ error: "Unknown report type." }, { status: 400 });
}
