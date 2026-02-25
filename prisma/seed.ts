import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Admin kullanici olustur
  const adminPassword = await hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@pixfora.com" },
    update: {},
    create: {
      email: "admin@pixfora.com",
      password: adminPassword,
      name: "Admin",
      role: "ADMIN",
    },
  });

  // Ornek kategoriler
  const elektronik = await prisma.category.upsert({
    where: { slug: "elektronik" },
    update: {},
    create: {
      name: "Elektronik",
      slug: "elektronik",
      description: "Elektronik urunler",
    },
  });

  await prisma.category.upsert({
    where: { slug: "telefonlar" },
    update: {},
    create: {
      name: "Telefonlar",
      slug: "telefonlar",
      description: "Cep telefonlari",
      parentId: elektronik.id,
    },
  });

  await prisma.category.upsert({
    where: { slug: "bilgisayarlar" },
    update: {},
    create: {
      name: "Bilgisayarlar",
      slug: "bilgisayarlar",
      description: "Dizustu ve masaustu bilgisayarlar",
      parentId: elektronik.id,
    },
  });

  const giyim = await prisma.category.upsert({
    where: { slug: "giyim" },
    update: {},
    create: {
      name: "Giyim",
      slug: "giyim",
      description: "Giyim urunleri",
    },
  });

  await prisma.category.upsert({
    where: { slug: "erkek-giyim" },
    update: {},
    create: {
      name: "Erkek Giyim",
      slug: "erkek-giyim",
      parentId: giyim.id,
    },
  });

  await prisma.category.upsert({
    where: { slug: "kadin-giyim" },
    update: {},
    create: {
      name: "Kadin Giyim",
      slug: "kadin-giyim",
      parentId: giyim.id,
    },
  });

  // Ornek markalar
  await prisma.brand.upsert({
    where: { slug: "apple" },
    update: {},
    create: { name: "Apple", slug: "apple" },
  });

  await prisma.brand.upsert({
    where: { slug: "samsung" },
    update: {},
    create: { name: "Samsung", slug: "samsung" },
  });

  await prisma.brand.upsert({
    where: { slug: "nike" },
    update: {},
    create: { name: "Nike", slug: "nike" },
  });

  // Genel ayarlar
  const settings = [
    { key: "site_name", value: "Pixfora", group: "general" },
    { key: "site_description", value: "E-Ticaret Sistemi", group: "general" },
    { key: "currency", value: "TRY", group: "general" },
    { key: "currency_symbol", value: "₺", group: "general" },
    { key: "free_shipping_min", value: "500", group: "shipping" },
    { key: "default_tax_rate", value: "20", group: "tax" },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log("Seed data olusturuldu.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
