import type { BankAccount } from "./types";
import { prisma } from "@/lib/db";

const DEFAULT_BANK_ACCOUNTS: BankAccount[] = [
  {
    bankName: "Ziraat Bankasi",
    accountHolder: "Pixfora Ticaret A.S.",
    iban: "TR00 0000 0000 0000 0000 0000 00",
    branch: "Istanbul / Kadikoy",
  },
  {
    bankName: "Is Bankasi",
    accountHolder: "Pixfora Ticaret A.S.",
    iban: "TR00 0000 0000 0000 0000 0000 00",
    branch: "Istanbul / Kadikoy",
  },
  {
    bankName: "Garanti BBVA",
    accountHolder: "Pixfora Ticaret A.S.",
    iban: "TR00 0000 0000 0000 0000 0000 00",
    branch: "Istanbul / Kadikoy",
  },
];

export async function getBankAccounts(): Promise<BankAccount[]> {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { startsWith: "bank_account_" } },
    });

    if (settings.length === 0) return DEFAULT_BANK_ACCOUNTS;

    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }

    const accounts: BankAccount[] = [];
    for (let i = 1; i <= 3; i++) {
      const name = map[`bank_account_${i}_name`];
      const holder = map[`bank_account_${i}_holder`];
      const iban = map[`bank_account_${i}_iban`];
      if (name && iban) {
        accounts.push({ bankName: name, accountHolder: holder || "", iban, branch: "" });
      }
    }

    return accounts.length > 0 ? accounts : DEFAULT_BANK_ACCOUNTS;
  } catch {
    return DEFAULT_BANK_ACCOUNTS;
  }
}

export function formatTransferDescription(orderNumber: string): string {
  return `Pixfora Siparis - ${orderNumber}`;
}
