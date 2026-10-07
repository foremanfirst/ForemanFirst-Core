import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import {
  PlanningEditorAuthorizationError,
  requireAuthorizedPlanningEditor,
} from "@/lib/planning/planning-editor-authorization";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    planningRecordId: string;
  }>;
};

/*
 * Resume position is navigation state only.
 *
 * It must never change Planning lifecycle, compliance,
 * approval, project assignment, or record content.
 */
export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const { planningRecordId } =
      await context.params;

    const authorization =
      await requireAuthorizedPlanningEditor(
        planningRecordId,
      );

    const body = await request.json();

    const lastVisitedStep =
      Number(body.lastVisitedStep);

    if (
      !Number.isInteger(lastVisitedStep) ||
      lastVisitedStep < 1 ||
      lastVisitedStep > 8
    ) {
      return NextResponse.json(
        {
          message:
            "Planning resume step must be an integer from 1 through 8.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Re-check tenant/project/archive boundaries at the
     * mutation itself. Authorization determines who may edit;
     * this query determines exactly what may be updated.
     */
    const result =
      await prisma.planningRecord.updateMany({
        where: {
          id: planningRecordId,
          tenantId:
            authorization.planningRecord.tenantId,
          projectId:
            authorization.planningRecord.projectId,
          isArchived: false,
        },

        data: {
          lastVisitedStep,
        },
      });

    if (result.count !== 1) {
      return NextResponse.json(
        {
          message:
            "Planning record was not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      planningRecordId,
      lastVisitedStep,
    });
  } catch (error) {
    if (
      error instanceof
      PlanningEditorAuthorizationError
    ) {
      return NextResponse.json(
        {
          message: error.message,
        },
        {
          status: error.status,
        },
      );
    }

    console.error(
      "Unable to save Planning resume position:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to save Planning resume position.",
      },
      {
        status: 500,
      },
    );
  }
}
