import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "general";

    if (!file) {
      return NextResponse.json({ error: "Dosya gerekli." }, { status: 400 });
    }

    const maxSize = parseInt(process.env.MAX_FILE_SIZE || "5242880");
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Dosya boyutu cok buyuk." },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Gecersiz dosya tipi." },
        { status: 400 }
      );
    }

    const uploadDir = path.join(
      process.cwd(),
      process.env.UPLOAD_DIR || "public/uploads",
      folder
    );
    await mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name);
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filepath = path.join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    const url = `/uploads/${folder}/${filename}`;

    const media = await prisma.media.create({
      data: {
        url,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        folder,
      },
    });

    return NextResponse.json({ url, media }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Dosya yuklenirken hata olustu." },
      { status: 500 }
    );
  }
}
