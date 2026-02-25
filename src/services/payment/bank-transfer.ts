import type { BankAccount } from "./types";

// Bu bilgiler admin panelinden ayarlanabilir, simdilik sabit
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

export function getBankAccounts(): BankAccount[] {
  return DEFAULT_BANK_ACCOUNTS;
}

export function formatTransferDescription(orderNumber: string): string {
  return `Pixfora Siparis - ${orderNumber}`;
}
