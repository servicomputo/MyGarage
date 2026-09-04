import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

const DEMO_EMAIL = "demo@garage.app";

// Auto-provisiona un usuario demo cuando no hay sesión activa.
// Así la app se puede usar directamente sin login.
async function getOrCreateDemoUser() {
  let user = await db.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!user) {
    const passwordHash = await bcrypt.hash("demo1234", 10);
    user = await db.user.create({
      data: { name: "Usuario Demo", email: DEMO_EMAIL, passwordHash },
    });
  }
  return user;
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return session.user as { id: string; email: string; name?: string | null };
  }
  // Sin login: usar el usuario demo automáticamente
  const user = await getOrCreateDemoUser();
  return { id: user.id, email: user.email, name: user.name };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user?.id) {
    throw new Error("No autenticado");
  }
  return user;
}
