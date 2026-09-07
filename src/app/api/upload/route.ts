import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/bmp": "bmp",
  "application/pdf": "pdf",
};

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "El archivo excede 10 MB" }, { status: 413 });
    }

    const ext = ALLOWED[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: `Tipo no permitido: ${file.type}. Solo imágenes y PDF.` },
        { status: 415 }
      );
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${randomUUID()}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    await fs.writeFile(filepath, buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (e) {
    console.error("[upload POST]", e);
    return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 });
  }
}
