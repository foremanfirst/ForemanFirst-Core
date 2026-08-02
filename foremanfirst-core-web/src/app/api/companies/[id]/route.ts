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
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const companyType =
      typeof body.companyType === "string"
        ? body.companyType.trim()
        : "";

    if (!name) {
      return NextResponse.json(
        { message: "Company name is required." },
        { status: 400 },
      );
    }

    if (!companyType) {
      return NextResponse.json(
        { message: "Company type is required." },
        { status: 400 },
      );
    }

    const company = await prisma.company.update({
      where: {
        id,
      },
      data: {
        name,
        companyType,
        email: cleanOptionalValue(body.email),
        phone: cleanOptionalValue(body.phone),
        address: cleanOptionalValue(body.address),
        city: cleanOptionalValue(body.city),
        state: cleanOptionalValue(body.state),
        zipCode: cleanOptionalValue(body.zipCode),
        isActive:
          typeof body.isActive === "boolean"
            ? body.isActive
            : true,
      },
    });

    return NextResponse.json({
      message: "Company updated successfully.",
      company,
    });
  } catch (error) {
    console.error("Update company error:", error);

    return NextResponse.json(
      { message: "Unable to update the company." },
      { status: 500 },
    );
  }
}

export async function DELETE(
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
        isArchived: true,
        archivedAt: new Date(),
        isActive: false,
      },
    });

    return NextResponse.json({
      message: "Company archived successfully.",
      company,
    });
  } catch (error) {
    console.error("Archive company error:", error);

    return NextResponse.json(
      { message: "Unable to archive the company." },
      { status: 500 },
    );
  }
}

function cleanOptionalValue(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();

  return cleaned.length > 0 ? cleaned : null;
}