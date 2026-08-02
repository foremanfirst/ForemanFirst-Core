import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const company = await prisma.company.update({
      where: {
        id,
      },
      data: {
        isArchived: false,
        archivedAt: null,
        isActive: true,
      },
    });

    return NextResponse.json({
      message: "Company restored successfully.",
      company,
    });
  } catch (error) {
    console.error("Restore company error:", error);

    return NextResponse.json(
      {
        message: "Unable to restore the company.",
      },
      {
        status: 500,
      },
    );
  }
}