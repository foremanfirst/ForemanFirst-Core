"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export type CreateContractorRequirementInput = {
  projectId: string;
  documentType: string;
  name: string;
  description?: string;
  isRequired: boolean;
  expirationRequired: boolean;
  reviewRequired: boolean;
  sortOrder: number;
};

export type UpdateContractorRequirementInput = {
  requirementId: string;
  projectId: string;
  documentType: string;
  name: string;
  description?: string;
  isRequired: boolean;
  expirationRequired: boolean;
  reviewRequired: boolean;
  sortOrder: number;
};

export async function createContractorRequirement(
  input: CreateContractorRequirementInput,
) {
  const projectId = input.projectId.trim();
  const documentType = input.documentType.trim();
  const name = input.name.trim();
  const description =
    input.description?.trim() || null;

  if (!projectId) {
    throw new Error("Project ID is required.");
  }

  if (!documentType) {
    throw new Error("Document type is required.");
  }

  if (!name) {
    throw new Error("Requirement name is required.");
  }

  const project =
    await prisma.project.findFirst({
      where: {
        id: projectId,
        isArchived: false,
      },

      select: {
        id: true,
        tenantId: true,
      },
    });

  if (!project) {
    throw new Error(
      "Project could not be found.",
    );
  }

  const existingRequirement =
    await prisma.contractorDocumentRequirement.findFirst({
      where: {
        tenantId: project.tenantId,
        projectId: project.id,
        documentType,
        isArchived: false,
      },

      select: {
        id: true,
      },
    });

  if (existingRequirement) {
    throw new Error(
      "A requirement with this document type already exists for this project.",
    );
  }

  const requirement =
    await prisma.contractorDocumentRequirement.create({
      data: {
        tenantId: project.tenantId,
        projectId: project.id,

        documentType,
        name,
        description,

        isRequired: input.isRequired,

        expirationRequired:
          input.expirationRequired,

        reviewRequired:
          input.reviewRequired,

        sortOrder: Math.max(
          0,
          Math.trunc(
            Number(input.sortOrder) || 0,
          ),
        ),

        isActive: true,
        isArchived: false,
        archivedAt: null,
      },
    });

  revalidatePath(
    `/projects/${project.id}/contractor-requirements`,
  );

  revalidatePath("/contractors");

  return {
    id: requirement.id,
    message: `${requirement.name} was added successfully.`,
  };
}

export async function updateContractorRequirement(
  input: UpdateContractorRequirementInput,
) {
  const requirementId =
    input.requirementId.trim();

  const projectId =
    input.projectId.trim();

  const documentType =
    input.documentType.trim();

  const name =
    input.name.trim();

  const description =
    input.description?.trim() || null;

  if (!requirementId) {
    throw new Error(
      "Requirement ID is required.",
    );
  }

  if (!projectId) {
    throw new Error(
      "Project ID is required.",
    );
  }

  if (!documentType) {
    throw new Error(
      "Document type is required.",
    );
  }

  if (!name) {
    throw new Error(
      "Requirement name is required.",
    );
  }

  const project =
    await prisma.project.findFirst({
      where: {
        id: projectId,
        isArchived: false,
      },

      select: {
        id: true,
        tenantId: true,
      },
    });

  if (!project) {
    throw new Error(
      "Project could not be found.",
    );
  }

  const requirement =
    await prisma.contractorDocumentRequirement.findFirst({
      where: {
        id: requirementId,
        projectId: project.id,
        tenantId: project.tenantId,
        isArchived: false,
      },

      select: {
        id: true,
      },
    });

  if (!requirement) {
    throw new Error(
      "Contractor requirement could not be found.",
    );
  }

  const duplicateRequirement =
    await prisma.contractorDocumentRequirement.findFirst({
      where: {
        tenantId: project.tenantId,
        projectId: project.id,
        documentType,
        isArchived: false,

        NOT: {
          id: requirementId,
        },
      },

      select: {
        id: true,
      },
    });

  if (duplicateRequirement) {
    throw new Error(
      "Another requirement with this document type already exists for this project.",
    );
  }

  const updatedRequirement =
    await prisma.contractorDocumentRequirement.update({
      where: {
        id: requirementId,
      },

      data: {
        documentType,
        name,
        description,

        isRequired:
          input.isRequired,

        expirationRequired:
          input.expirationRequired,

        reviewRequired:
          input.reviewRequired,

        sortOrder: Math.max(
          0,
          Math.trunc(
            Number(input.sortOrder) || 0,
          ),
        ),
      },
    });

  revalidatePath(
    `/projects/${project.id}/contractor-requirements`,
  );

  revalidatePath("/contractors");

  return {
    id: updatedRequirement.id,
    message: `${updatedRequirement.name} was updated successfully.`,
  };
}

export async function archiveContractorRequirement(
  requirementId: string,
  projectId: string,
) {
  const cleanRequirementId =
    requirementId.trim();

  const cleanProjectId =
    projectId.trim();

  if (!cleanRequirementId) {
    throw new Error(
      "Requirement ID is required.",
    );
  }

  if (!cleanProjectId) {
    throw new Error(
      "Project ID is required.",
    );
  }

  const requirement =
    await prisma.contractorDocumentRequirement.findFirst({
      where: {
        id: cleanRequirementId,
        projectId: cleanProjectId,
        isArchived: false,
      },

      select: {
        id: true,
        name: true,
        projectId: true,
      },
    });

  if (!requirement) {
    throw new Error(
      "Contractor requirement could not be found.",
    );
  }

  await prisma.contractorDocumentRequirement.update({
    where: {
      id: requirement.id,
    },

    data: {
      isActive: false,
      isArchived: true,
      archivedAt: new Date(),
    },
  });

  revalidatePath(
    `/projects/${requirement.projectId}/contractor-requirements`,
  );

  revalidatePath("/contractors");

  return {
    id: requirement.id,
    message: `${requirement.name} was archived successfully.`,
  };
}

export async function restoreContractorRequirement(
  requirementId: string,
  projectId: string,
) {
  const cleanRequirementId =
    requirementId.trim();

  const cleanProjectId =
    projectId.trim();

  if (!cleanRequirementId) {
    throw new Error(
      "Requirement ID is required.",
    );
  }

  if (!cleanProjectId) {
    throw new Error(
      "Project ID is required.",
    );
  }

  const requirement =
    await prisma.contractorDocumentRequirement.findFirst({
      where: {
        id: cleanRequirementId,
        projectId: cleanProjectId,
        isArchived: true,
      },

      select: {
        id: true,
        name: true,
        documentType: true,
        projectId: true,
        tenantId: true,
      },
    });

  if (!requirement) {
    throw new Error(
      "Archived contractor requirement could not be found.",
    );
  }

  const existingRequirement =
    await prisma.contractorDocumentRequirement.findFirst({
      where: {
        tenantId: requirement.tenantId,
        projectId: requirement.projectId,
        documentType: requirement.documentType,
        isArchived: false,

        NOT: {
          id: requirement.id,
        },
      },

      select: {
        id: true,
      },
    });

  if (existingRequirement) {
    throw new Error(
      "An active requirement with this document type already exists.",
    );
  }

  await prisma.contractorDocumentRequirement.update({
    where: {
      id: requirement.id,
    },

    data: {
      isActive: true,
      isArchived: false,
      archivedAt: null,
    },
  });

  revalidatePath(
    `/projects/${requirement.projectId}/contractor-requirements`,
  );

  revalidatePath(
    `/projects/${requirement.projectId}/contractor-requirements/archived`,
  );

  revalidatePath("/contractors");

  return {
    id: requirement.id,
    message: `${requirement.name} was restored successfully.`,
  };
}