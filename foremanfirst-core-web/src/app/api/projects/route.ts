import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/projects
 *
 * Returns all active, non-archived projects.
 */
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      where: {
        isArchived: false,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            companyType: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      projects: projects.map(serializeProject),
    });
  } catch (error) {
    console.error("Get projects error:", error);

    return NextResponse.json(
      {
        message: "Unable to load projects.",
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * POST /api/projects
 *
 * Creates a database-backed project.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = cleanRequiredString(body.name);
    const companyId = cleanRequiredString(body.companyId);

    if (!name) {
      return NextResponse.json(
        {
          message: "Project name is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!companyId) {
      return NextResponse.json(
        {
          message: "Managing company is required.",
        },
        {
          status: 400,
        },
      );
    }

    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        isArchived: false,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        {
          message:
            "The selected managing company could not be found.",
        },
        {
          status: 404,
        },
      );
    }

    const startDate = parseOptionalDate(body.startDate);
    const endDate = parseOptionalDate(body.endDate);

    if (body.startDate && !startDate) {
      return NextResponse.json(
        {
          message: "Start date is invalid.",
        },
        {
          status: 400,
        },
      );
    }

    if (body.endDate && !endDate) {
      return NextResponse.json(
        {
          message: "Target completion date is invalid.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      startDate &&
      endDate &&
      endDate.getTime() < startDate.getTime()
    ) {
      return NextResponse.json(
        {
          message:
            "Target completion date cannot be before the start date.",
        },
        {
          status: 400,
        },
      );
    }

    const progress = clampInteger(body.progress, 0, 100, 0);

    const trainingCompliance = clampInteger(
      body.trainingCompliance,
      0,
      100,
      100,
    );

    const accessCompliance = clampInteger(
      body.accessCompliance,
      0,
      100,
      100,
    );

    const healthScore = clampInteger(
      body.healthScore,
      0,
      100,
      100,
    );

    const project = await prisma.project.create({
      data: {
        tenantId: company.tenantId,
        companyId: company.id,

        name,
        projectCode: cleanOptionalString(body.projectCode),
        clientName: cleanOptionalString(body.clientName),
        projectType: cleanOptionalString(body.projectType),
        description: cleanOptionalString(body.description),

        address: cleanOptionalString(body.address),
        city: cleanOptionalString(body.city),
        state: cleanOptionalString(body.state),
        zipCode: cleanOptionalString(body.zipCode),
        location: cleanOptionalString(body.location),

        status:
          cleanOptionalString(body.status) || "Planning",

        startDate,
        endDate,

        projectManager: cleanOptionalString(
          body.projectManager,
        ),
        superintendent: cleanOptionalString(
          body.superintendent,
        ),
        safetyManager: cleanOptionalString(body.safetyManager),

        contractValue: parseOptionalDecimal(
          body.contractValue,
        ),

        plannedWorkforce: safeNonNegativeInteger(
          body.plannedWorkforce,
        ),
        currentWorkforce: safeNonNegativeInteger(
          body.currentWorkforce,
        ),
        workersOnsite: safeNonNegativeInteger(
          body.workersOnsite,
        ),
        activeContractors: safeNonNegativeInteger(
          body.activeContractors,
        ),
        totalManHours: safeNonNegativeInteger(
          body.totalManHours,
        ),

        progress,
        openActions: safeNonNegativeInteger(body.openActions),
        recordableIncidents: safeNonNegativeInteger(
          body.recordableIncidents,
        ),
        permitsOpen: safeNonNegativeInteger(body.permitsOpen),
        planningDocumentsPending: safeNonNegativeInteger(
          body.planningDocumentsPending,
        ),
        trainingCompliance,
        accessCompliance,
        healthScore,

        isActive:
          typeof body.isActive === "boolean"
            ? body.isActive
            : true,

        isArchived: false,
        archivedAt: null,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            companyType: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Project created successfully.",
        project: serializeProject(project),
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create project error:", error);

    return NextResponse.json(
      {
        message: "Unable to create the project.",
      },
      {
        status: 500,
      },
    );
  }
}

function serializeProject<
  T extends {
    contractValue: unknown;
  },
>(project: T) {
  return {
    ...project,
    contractValue:
      project.contractValue === null ||
      project.contractValue === undefined
        ? null
        : Number(project.contractValue),
  };
}

function cleanRequiredString(value: unknown): string {
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

function safeNonNegativeInteger(value: unknown): number {
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
    return null;
  }

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}