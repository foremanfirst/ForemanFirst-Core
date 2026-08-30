import "server-only";

import { prisma } from "@/lib/prisma";

export class QorevaAuthenticationError extends Error {
  constructor(message = "Authentication is required.") {
    super(message);
    this.name = "QorevaAuthenticationError";
  }
}

export type QorevaCurrentUser = {
  id: string;
  displayName: string;
  email: string;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function requireCurrentUser(): Promise<QorevaCurrentUser> {
  /*
   * DEVELOPMENT AUTHENTICATION ADAPTER
   *
   * This is intentionally isolated from Planning and other
   * application services.
   *
   * Production authentication will eventually resolve the
   * authenticated identity from the application's trusted
   * server-side session and then return the corresponding
   * Qoreva User through this same function.
   *
   * Never accept a user ID, email, name, or role from the
   * browser as proof of identity.
   */

  if (process.env.NODE_ENV === "production") {
    throw new QorevaAuthenticationError(
      "Production authentication has not been configured.",
    );
  }

  const configuredEmail =
    process.env.QOREVA_DEV_USER_EMAIL;

  if (!configuredEmail?.trim()) {
    throw new QorevaAuthenticationError(
      "Development user identity is not configured.",
    );
  }

  const email =
    normalizeEmail(configuredEmail);

  const user =
    await prisma.user.findUnique({
      where: {
        email,
      },

      select: {
        id: true,
        displayName: true,
        email: true,
        status: true,
        isActive: true,
      },
    });

  if (!user) {
    throw new QorevaAuthenticationError(
      "The configured development user was not found.",
    );
  }

  if (
    !user.isActive ||
    user.status !== "Active"
  ) {
    throw new QorevaAuthenticationError(
      "The configured development user is not active.",
    );
  }

  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
  };
}