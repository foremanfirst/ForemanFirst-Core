"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const DEFAULT_TENANT_ID = "foremanfirst-demo";

type ContractorPayload = {
  companyId: string;
  projectId?: string | null;
  name: string;
  legalName?: string | null;
  contractorCode?: string | null;
  trade?: string | null;
  specialty?: string | null;
  description?: string | null;
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  primaryContactPhone?: string | null;
  safetyContactName?: string | null;
  safetyContactEmail?: string | null;
  safetyContactPhone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  workforceCount?: number;
  emr?: number | null;
  trir?: number | null;
  insuranceProvider?: string | null;
  insuranceExpiresAt?: string | null;
  orientationStatus?: string;
  complianceStatus?: string;
  approvalStatus?: string;
  isActive?: boolean;
};

function cleanOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();

  return cleaned.length > 0 ? cleaned : null;
}

function cleanRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

function cleanOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new Error("A numeric field contains an invalid value.");
  }

  return numberValue;
}

function cleanWholeNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error("Workforce count must be a positive number.");
  }

  return Math.floor(numberValue);
}

function parseOptionalDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("A date field contains an invalid value.");
  }

  return date;
}

function validateEmail(value: string | null, fieldName: string): void {
  if (!value) {
    return;
  }

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  if (!valid) {
    throw new Error(`${fieldName} must be a valid email address.`);
  }
}

function normalizePayload(payload: ContractorPayload) {
  const companyId = cleanRequiredString(payload.companyId, "Company");
  const name = cleanRequiredString(payload.name, "Contractor name");

  const primaryContactEmail = cleanOptionalString(
    payload.primaryContactEmail,
  );

  const safetyContactEmail = cleanOptionalString(
    payload.safetyContactEmail,
  );

  validateEmail(primaryContactEmail, "Primary contact email");
  validateEmail(safetyContactEmail, "Safety contact email");

  return {
    companyId,
    projectId: cleanOptionalString(payload.projectId),

    name,
    legalName: cleanOptionalString(payload.legalName),
    contractorCode: cleanOptionalString(payload.contractorCode),

    trade: cleanOptionalString(payload.trade),
    specialty: cleanOptionalString(payload.specialty),
    description: cleanOptionalString(payload.description),

    primaryContactName: cleanOptionalString(
      payload.primaryContactName,
    ),
    primaryContactEmail,
    primaryContactPhone: cleanOptionalString(
      payload.primaryContactPhone,
    ),

    safetyContactName: cleanOptionalString(
      payload.safetyContactName,
    ),
    safetyContactEmail,
    safetyContactPhone: cleanOptionalString(
      payload.safetyContactPhone,
    ),

    address: cleanOptionalString(payload.address),
    city: cleanOptionalString(payload.city),
    state: cleanOptionalString(payload.state),
    zipCode: cleanOptionalString(payload.zipCode),

    workforceCount: cleanWholeNumber(payload.workforceCount),

    emr: cleanOptionalNumber(payload.emr),
    trir: cleanOptionalNumber(payload.trir),

    insuranceProvider: cleanOptionalString(
      payload.insuranceProvider,
    ),
    insuranceExpiresAt: parseOptionalDate(
      payload.insuranceExpiresAt,
    ),

    orientationStatus:
      cleanOptionalString(payload.orientationStatus) ?? "Pending",

    complianceStatus:
      cleanOptionalString(payload.complianceStatus) ?? "Pending",

    approvalStatus:
      cleanOptionalString(payload.approvalStatus) ?? "Pending",

    isActive: payload.isActive ?? true,
  };
}

export async function createContractor(
  payload: ContractorPayload,
) {
  const data = normalizePayload(payload);

  const company = await prisma.company.findFirst({
    where: {
      id: data.companyId,
      tenantId: DEFAULT_TENANT_ID,
      isArchived: false,
    },
    select: {
      id: true,
    },
  });

  if (!company) {
    throw new Error("The selected company could not be found.");
  }

  if (data.projectId) {
    const project = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        tenantId: DEFAULT_TENANT_ID,
        isArchived: false,
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      throw new Error("The selected project could not be found.");
    }
  }

  const contractor = await prisma.contractor.create({
    data: {
      tenantId: DEFAULT_TENANT_ID,
      ...data,
    },
  });

  revalidatePath("/contractors");
  revalidatePath("/projects");
  revalidatePath("/companies");

  return {
    success: true,
    contractorId: contractor.id,
  };
}

export async function updateContractor(
  contractorId: string,
  payload: ContractorPayload,
) {
  const id = cleanRequiredString(contractorId, "Contractor ID");
  const data = normalizePayload(payload);

  const existingContractor = await prisma.contractor.findFirst({
    where: {
      id,
      tenantId: DEFAULT_TENANT_ID,
    },
    select: {
      id: true,
    },
  });

  if (!existingContractor) {
    throw new Error("The contractor could not be found.");
  }

  const company = await prisma.company.findFirst({
    where: {
      id: data.companyId,
      tenantId: DEFAULT_TENANT_ID,
      isArchived: false,
    },
    select: {
      id: true,
    },
  });

  if (!company) {
    throw new Error("The selected company could not be found.");
  }

  if (data.projectId) {
    const project = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        tenantId: DEFAULT_TENANT_ID,
        isArchived: false,
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      throw new Error("The selected project could not be found.");
    }
  }

  await prisma.contractor.update({
    where: {
      id,
    },
    data,
  });

  revalidatePath("/contractors");
  revalidatePath("/projects");
  revalidatePath("/companies");

  return {
    success: true,
  };
}

export async function archiveContractor(
  contractorId: string,
) {
  const id = cleanRequiredString(contractorId, "Contractor ID");

  const contractor = await prisma.contractor.findFirst({
    where: {
      id,
      tenantId: DEFAULT_TENANT_ID,
      isArchived: false,
    },
    select: {
      id: true,
    },
  });

  if (!contractor) {
    throw new Error(
      "The contractor could not be found or is already archived.",
    );
  }

  await prisma.contractor.update({
    where: {
      id,
    },
    data: {
      isArchived: true,
      isActive: false,
      archivedAt: new Date(),
    },
  });

  revalidatePath("/contractors");
  revalidatePath("/contractors/archived");
  revalidatePath("/projects");
  revalidatePath("/companies");

  return {
    success: true,
  };
}

export async function restoreContractor(
  contractorId: string,
) {
  const id = cleanRequiredString(contractorId, "Contractor ID");

  const contractor = await prisma.contractor.findFirst({
    where: {
      id,
      tenantId: DEFAULT_TENANT_ID,
      isArchived: true,
    },
    select: {
      id: true,
    },
  });

  if (!contractor) {
    throw new Error(
      "The contractor could not be found or is not archived.",
    );
  }

  await prisma.contractor.update({
    where: {
      id,
    },
    data: {
      isArchived: false,
      isActive: true,
      archivedAt: null,
    },
  });

  revalidatePath("/contractors");
  revalidatePath("/contractors/archived");
  revalidatePath("/projects");
  revalidatePath("/companies");

  return {
    success: true,
  };
}