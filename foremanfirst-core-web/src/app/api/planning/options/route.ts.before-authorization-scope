import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [projects, contractors] = await Promise.all([
      prisma.project.findMany({
        where: {
          isArchived: false,
          isActive: true,
        },
        select: {
          id: true,
          tenantId: true,
          name: true,
          projectCode: true,
          companyId: true,
          clientName: true,
          status: true,
          location: true,
          city: true,
          state: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      }),

      prisma.contractor.findMany({
        where: {
          isArchived: false,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          legalName: true,
          contractorCode: true,
          companyId: true,
          projectId: true,
          trade: true,
          approvalStatus: true,
          complianceStatus: true,
          orientationStatus: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              projectCode: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      }),
    ]);

    return NextResponse.json({
      projects,
      contractors,
    });
  } catch (error) {
    console.error(
      "Planning options load failed:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to load planning assignment options.",
      },
      {
        status: 500,
      },
    );
  }
}