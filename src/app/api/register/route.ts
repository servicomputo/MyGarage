import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "Este correo ya está registrado" }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: { name, email: normalizedEmail, passwordHash },
    });
    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (e) {
    console.error("[register]", e);
    return NextResponse.json({ error: "Error al registrar usuario" }, { status: 500 });
  }
}
