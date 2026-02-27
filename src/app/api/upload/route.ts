import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { prisma } from "@/lib/db";

const MAX_WIDTH = 1920;
const THUMB_SIZE = 400;
const WEBP_QUALITY = 85;

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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const baseName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const isSvg = file.type === "image/svg+xml";
    const isGif = file.type === "image/gif";

    let url: string;
    let thumbnailUrl: string | null = null;
    let finalSize = file.size;
    let finalMimeType = file.type;

    if (isSvg || isGif) {
      // SVG ve GIF dosyalarını olduğu gibi kaydet (Sharp ile işleme uygun değil)
      const ext = path.extname(file.name);
      const filename = `${baseName}${ext}`;
      const filepath = path.join(uploadDir, filename);
      await writeFile(filepath, buffer);
      url = `/uploads/${folder}/${filename}`;
    } else {
      // Sharp ile optimize et: WebP'ye dönüştür
      try {
        const image = sharp(buffer);
        const metadata = await image.metadata();

        // Orijinal — max genişlik sınırı + WebP dönüşüm
        let pipeline = image.clone();
        if (metadata.width && metadata.width > MAX_WIDTH) {
          pipeline = pipeline.resize(MAX_WIDTH, undefined, { withoutEnlargement: true });
        }
        const optimized = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();

        const mainFilename = `${baseName}.webp`;
        await writeFile(path.join(uploadDir, mainFilename), optimized);
        url = `/uploads/${folder}/${mainFilename}`;
        finalSize = optimized.length;
        finalMimeType = "image/webp";

        // Thumbnail oluştur (400x400)
        const thumbBuffer = await sharp(buffer)
          .resize(THUMB_SIZE, THUMB_SIZE, {
            fit: "cover",
            withoutEnlargement: true,
          })
          .webp({ quality: 75 })
          .toBuffer();

        const thumbFilename = `thumb-${baseName}.webp`;
        await writeFile(path.join(uploadDir, thumbFilename), thumbBuffer);
        thumbnailUrl = `/uploads/${folder}/${thumbFilename}`;
      } catch {
        // Sharp hata verirse orijinal dosyayı kaydet
        const ext = path.extname(file.name);
        const filename = `${baseName}${ext}`;
        await writeFile(path.join(uploadDir, filename), buffer);
        url = `/uploads/${folder}/${filename}`;
      }
    }

    const media = await prisma.media.create({
      data: {
        url,
        filename: file.name,
        mimeType: finalMimeType,
        size: finalSize,
        folder,
      },
    });

    return NextResponse.json(
      { url, thumbnailUrl, media },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Dosya yuklenirken hata olustu." },
      { status: 500 }
    );
  }
}
