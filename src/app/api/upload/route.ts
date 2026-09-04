import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/session";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg", "application/pdf"]);

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "application/pdf":
      return ".pdf";
    default:
      return "";
  }
}

function extFromName(name: string): string {
  const i = name.lastIndexOf(".");
  if (i === -1) return "";
  return name.slice(i).toLowerCase();
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Archivo no proporcionado" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "El archivo excede 10MB" }, { status: 413 });
    }

    const mime = file.type || "";
    const isPdf = mime === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImage = mime.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(file.name);
    if (!isPdf && !isImage) {
      return NextResponse.json({ error: "Tipo de archivo no permitido (sólo imágenes o PDF)" }, { status: 415 });
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const ext = extFromMime(mime) || extFromName(file.name) || (isPdf ? ".pdf" : ".jpg");
    const filename = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (e) {
    console.error("[upload POST]", e);
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 });
  }
}

// Avoid unused warning when ALLOWED is not referenced directly
void ALLOWED;
