import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/companies
 *
 * Returns all active, non-archived companies.
 */
export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      where: {
        isArchived: false,
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        companyType: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      companies,
    });
  } catch (error) {
    console.error("Get companies error:", error);

    return NextResponse.json(
      {
        message: "Unable to load companies.",
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * POST /api/companies
 *
 * Creates a new company.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const companyType =
      typeof body.companyType === "string"
        ? body.companyType.trim()
        : "";

    if (!name) {
      return NextResponse.json(
        {
          message: "Company name is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!companyType) {
      return NextResponse.json(
        {
          message: "Company type is required.",
        },
        {
          status: 400,
        },
      );
    }

    const company = await prisma.company.create({
      data: {
        tenantId: "development-tenant",
        name,
        companyType,
        email: cleanOptionalValue(body.email),
        phone: cleanOptionalValue(body.phone),
        address: cleanOptionalValue(body.address),
        city: cleanOptionalValue(body.city),
        state: cleanOptionalValue(body.state),
        zipCode: cleanOptionalValue(body.zipCode),
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        message: "Company created successfully.",
        company,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create company error:", error);

    return NextResponse.json(
      {
        message: "Unable to create the company.",
      },
      {
        status: 500,
      },
    );
  }
}

function cleanOptionalValue(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();

  return cleaned.length > 0 ? cleaned : null;
}