"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type CreateCompanyState = {
  success: boolean;
  message: string;
};

export async function createCompany(
  _previousState: CreateCompanyState,
  formData: FormData,
): Promise<CreateCompanyState> {
  const name = formData.get("name")?.toString().trim() ?? "";
  const companyType =
    formData.get("companyType")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim() || null;
  const phone = formData.get("phone")?.toString().trim() || null;
  const address = formData.get("address")?.toString().trim() || null;
  const city = formData.get("city")?.toString().trim() || null;
  const state = formData.get("state")?.toString().trim() || null;
  const zipCode = formData.get("zipCode")?.toString().trim() || null;

  if (!name) {
    return {
      success: false,
      message: "Company name is required.",
    };
  }

  if (!companyType) {
    return {
      success: false,
      message: "Company type is required.",
    };
  }

  try {
    await prisma.company.create({
      data: {
        // Temporary development tenant until authentication is added.
        tenantId: "development-tenant",
        name,
        companyType,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        isActive: true,
      },
    });

    revalidatePath("/companies");

    return {
      success: true,
      message: "Company created successfully.",
    };
  } catch (error) {
    console.error("Unable to create company:", error);

    return {
      success: false,
      message: "Unable to create the company. Please try again.",
    };
  }
}