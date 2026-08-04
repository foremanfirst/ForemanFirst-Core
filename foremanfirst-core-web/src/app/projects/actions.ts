"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export interface CreateProjectInput {
  companyId: string;

  name: string;
  projectCode?: string | null;
  clientName?: string | null;
  projectType?: string | null;
  description?: string | null;

  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  location?: string | null;

  status?: string;

  startDate?: string | null;
  endDate?: string | null;

  projectManager?: string | null;
  superintendent?: string | null;
  safetyManager?: string | null;

  contractValue?: number | null;

  plannedWorkforce?: number;
  currentWorkforce?: number;
  workersOnsite?: number;
  activeContractors?: number;
  totalManHours?: number;

  progress?: number;
  openActions?: number;
  recordableIncidents?: number;
  permitsOpen?: number;
  planningDocumentsPending?: number;
  trainingCompliance?: number;
  accessCompliance?: number;
  healthScore?: number;

  isActive?: boolean;
}

export interface UpdateProjectInput extends CreateProjectInput {
  id: string;
}

export async function createProject(
  input: CreateProjectInput,
) {
  const companyId = cleanRequiredString(input.companyId);
  const name = cleanRequiredString(input.name);

  if (!companyId) {
    throw new Error("Select a managing company.");
  }

  if (!name) {
    throw new Error("Project name is required.");
  }

  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      isArchived: false,
    },
    select: {
      id: true,
      tenantId: true,
    },
  });

  if (!company) {
    throw new Error(
      "The selected managing company could not be found.",
    );
  }

  const startDate = parseOptionalDate(input.startDate);
  const endDate = parseOptionalDate(input.endDate);

  validateDateRange(startDate, endDate);

  const project = await prisma.project.create({
    data: {
      tenantId: company.tenantId,
      companyId: company.id,

      name,
      projectCode: cleanOptionalString(input.projectCode),
      clientName: cleanOptionalString(input.clientName),
      projectType: cleanOptionalString(input.projectType),
      description: cleanOptionalString(input.description),

      address: cleanOptionalString(input.address),
      city: cleanOptionalString(input.city),
      state: cleanOptionalString(input.state),
      zipCode: cleanOptionalString(input.zipCode),
      location: cleanOptionalString(input.location),

      status:
        cleanOptionalString(input.status) || "Planning",

      startDate,
      endDate,

      projectManager: cleanOptionalString(
        input.projectManager,
      ),
      superintendent: cleanOptionalString(
        input.superintendent,
      ),
      safetyManager: cleanOptionalString(
        input.safetyManager,
      ),

      contractValue: parseOptionalDecimal(
        input.contractValue,
      ),

      plannedWorkforce: safeNonNegativeInteger(
        input.plannedWorkforce,
      ),
      currentWorkforce: safeNonNegativeInteger(
        input.currentWorkforce,
      ),
      workersOnsite: safeNonNegativeInteger(
        input.workersOnsite,
      ),
      activeContractors: safeNonNegativeInteger(
        input.activeContractors,
      ),
      totalManHours: safeNonNegativeInteger(
        input.totalManHours,
      ),

      progress: clampInteger(
        input.progress,
        0,
        100,
        0,
      ),

      openActions: safeNonNegativeInteger(
        input.openActions,
      ),

      recordableIncidents: safeNonNegativeInteger(
        input.recordableIncidents,
      ),

      permitsOpen: safeNonNegativeInteger(
        input.permitsOpen,
      ),

      planningDocumentsPending: safeNonNegativeInteger(
        input.planningDocumentsPending,
      ),

      trainingCompliance: clampInteger(
        input.trainingCompliance,
        0,
        100,
        100,
      ),

      accessCompliance: clampInteger(
        input.accessCompliance,
        0,
        100,
        100,
      ),

      healthScore: clampInteger(
        input.healthScore,
        0,
        100,
        100,
      ),

      isActive:
        typeof input.isActive === "boolean"
          ? input.isActive
          : true,

      isArchived: false,
      archivedAt: null,
    },
  });

  revalidateProjectRoutes();

  return {
    id: project.id,
    message: "Project created successfully.",
  };
}

export async function updateProject(
  input: UpdateProjectInput,
) {
  const id = cleanRequiredString(input.id);
  const companyId = cleanRequiredString(input.companyId);
  const name = cleanRequiredString(input.name);

  if (!id) {
    throw new Error("Project ID is required.");
  }

  if (!companyId) {
    throw new Error("Select a managing company.");
  }

  if (!name) {
    throw new Error("Project name is required.");
  }

  const existingProject =
    await prisma.project.findFirst({
      where: {
        id,
        isArchived: false,
      },
      select: {
        id: true,
      },
    });

  if (!existingProject) {
    throw new Error("Project could not be found.");
  }

  const company = await prisma.company.findFirst({
    where: {
      id: companyId,
      isArchived: false,
    },
    select: {
      id: true,
      tenantId: true,
    },
  });

  if (!company) {
    throw new Error(
      "The selected managing company could not be found.",
    );
  }

  const startDate = parseOptionalDate(input.startDate);
  const endDate = parseOptionalDate(input.endDate);

  validateDateRange(startDate, endDate);

  await prisma.project.update({
    where: {
      id,
    },
    data: {
      tenantId: company.tenantId,
      companyId: company.id,

      name,
      projectCode: cleanOptionalString(input.projectCode),
      clientName: cleanOptionalString(input.clientName),
      projectType: cleanOptionalString(input.projectType),
      description: cleanOptionalString(input.description),

      address: cleanOptionalString(input.address),
      city: cleanOptionalString(input.city),
      state: cleanOptionalString(input.state),
      zipCode: cleanOptionalString(input.zipCode),
      location: cleanOptionalString(input.location),

      status:
        cleanOptionalString(input.status) || "Planning",

      startDate,
      endDate,

      projectManager: cleanOptionalString(
        input.projectManager,
      ),
      superintendent: cleanOptionalString(
        input.superintendent,
      ),
      safetyManager: cleanOptionalString(
        input.safetyManager,
      ),

      contractValue: parseOptionalDecimal(
        input.contractValue,
      ),

      plannedWorkforce: safeNonNegativeInteger(
        input.plannedWorkforce,
      ),
      currentWorkforce: safeNonNegativeInteger(
        input.currentWorkforce,
      ),
      workersOnsite: safeNonNegativeInteger(
        input.workersOnsite,
      ),
      activeContractors: safeNonNegativeInteger(
        input.activeContractors,
      ),
      totalManHours: safeNonNegativeInteger(
        input.totalManHours,
      ),

      progress: clampInteger(
        input.progress,
        0,
        100,
        0,
      ),

      openActions: safeNonNegativeInteger(
        input.openActions,
      ),

      recordableIncidents: safeNonNegativeInteger(
        input.recordableIncidents,
      ),

      permitsOpen: safeNonNegativeInteger(
        input.permitsOpen,
      ),

      planningDocumentsPending: safeNonNegativeInteger(
        input.planningDocumentsPending,
      ),

      trainingCompliance: clampInteger(
        input.trainingCompliance,
        0,
        100,
        100,
      ),

      accessCompliance: clampInteger(
        input.accessCompliance,
        0,
        100,
        100,
      ),

      healthScore: clampInteger(
        input.healthScore,
        0,
        100,
        100,
      ),

      isActive:
        typeof input.isActive === "boolean"
          ? input.isActive
          : true,
    },
  });

  revalidateProjectRoutes();

  return {
    id,
    message: "Project updated successfully.",
  };
}

export async function archiveProject(
  projectId: string,
) {
  const id = cleanRequiredString(projectId);

  if (!id) {
    throw new Error("Project ID is required.");
  }

  const project = await prisma.project.findFirst({
    where: {
      id,
      isArchived: false,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!project) {
    throw new Error("Project could not be found.");
  }

  await prisma.project.update({
    where: {
      id,
    },
    data: {
      isArchived: true,
      isActive: false,
      archivedAt: new Date(),
      status: "Archived",
    },
  });

  revalidateProjectRoutes();

  return {
    id,
    message: `${project.name} was archived.`,
  };
}

export async function restoreProject(
  projectId: string,
) {
  const id = cleanRequiredString(projectId);

  if (!id) {
    throw new Error("Project ID is required.");
  }

  const project = await prisma.project.findFirst({
    where: {
      id,
      isArchived: true,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!project) {
    throw new Error(
      "Archived project could not be found.",
    );
  }

  await prisma.project.update({
    where: {
      id,
    },
    data: {
      isArchived: false,
      isActive: true,
      archivedAt: null,
      status: "Planning",
    },
  });

  revalidateProjectRoutes();

  return {
    id,
    message: `${project.name} was restored.`,
  };
}

export async function deleteProject(
  projectId: string,
) {
  const id = cleanRequiredString(projectId);

  if (!id) {
    throw new Error("Project ID is required.");
  }

  const project = await prisma.project.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          workers: true,
          contractors: true,
        },
      },
    },
  });

  if (!project) {
    throw new Error("Project could not be found.");
  }

  if (
    project._count.workers > 0 ||
    project._count.contractors > 0
  ) {
    throw new Error(
      "This project has connected workers or contractors and cannot be permanently deleted. Archive it instead.",
    );
  }

  await prisma.project.delete({
    where: {
      id,
    },
  });

  revalidateProjectRoutes();

  return {
    id,
    message: `${project.name} was permanently deleted.`,
  };
}

function revalidateProjectRoutes() {
  revalidatePath("/projects");
  revalidatePath("/contractors");
  revalidatePath("/companies");
  revalidatePath("/dashboard");
  revalidatePath("/api/projects");
}

function cleanRequiredString(
  value: unknown,
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function cleanOptionalString(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();

  return cleaned.length > 0 ? cleaned : null;
}

function safeNonNegativeInteger(
  value: unknown,
): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.trunc(parsed));
}

function clampInteger(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(
    Math.max(Math.trunc(parsed), minimum),
    maximum,
  );
}

function parseOptionalDecimal(
  value: unknown,
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function parseOptionalDate(
  value: unknown,
): Date | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("Project date is invalid.");
  }

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Project date is invalid.");
  }

  return date;
}

function validateDateRange(
  startDate: Date | null,
  endDate: Date | null,
) {
  if (
    startDate &&
    endDate &&
    endDate.getTime() < startDate.getTime()
  ) {
    throw new Error(
      "Target completion date cannot be before the start date.",
    );
  }
}