"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/store/cart";

type Step = "address" | "shipping" | "payment" | "confirm";

interface AddressForm {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  zipCode: string;
}

interface CardForm {
  holderName: string;
  number: string;
  expireMonth: string;
  expireYear: string;
  cvc: string;
}

interface BankAccount {
  bankName: string;
  accountHolder: string;
  iban: string;
}

export default function CheckoutClient() {
  const router = useRouter();
  const { items, getSubtotal, getItemPrice, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("address");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const iframeRef = useRef<HTMLDivElement>(null);

  const [addressForm, setAddressForm] = useState<AddressForm>({
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    district: "",
    address: "",
    zipCode: "",
  });

  const [cardForm, setCardForm] = useState<CardForm>({
    holderName: "",
    number: "",
    expireMonth: "",
    expireYear: "",
    cvc: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<string>("CREDIT_CARD");
  const [couponCode, setCouponCode] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [note, setNote] = useState("");
  const [selectedShipping, setSelectedShipping] = useState("standard");
  const [showBankInfo, setShowBankInfo] = useState(false);

  const bankAccounts: BankAccount[] = [
    { bankName: "Ziraat Bankasi", accountHolder: "Pixfora Ticaret A.S.", iban: "TR00 0000 0000 0000 0000 0000 00" },
    { bankName: "Is Bankasi", accountHolder: "Pixfora Ticaret A.S.", iban: "TR00 0000 0000 0000 0000 0000 00" },
    { bankName: "Garanti BBVA", accountHolder: "Pixfora Ticaret A.S.", iban: "TR00 0000 0000 0000 0000 0000 00" },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="max-w-4xl mx-auto px-4 py-8"><p>Yukleniyor...</p></div>;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Sepetiniz Bos</h1>
        <p className="text-muted-foreground mb-6">Odeme yapabilmek icin sepetinize urun ekleyin.</p>
        <Link href="/kategori" className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
          Alisverise Basla
        </Link>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const baseShippingCost = subtotal >= 500 ? 0 : 39.9;
  const shippingCost = selectedShipping === "express" ? baseShippingCost + 20 : baseShippingCost;
  const codFee = paymentMethod === "CASH_ON_DELIVERY" ? 10 : 0;
  const total = subtotal + shippingCost + codFee;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(price);

  const steps: { key: Step; label: string }[] = [
    { key: "address", label: "Adres" },
    { key: "shipping", label: "Kargo" },
    { key: "payment", label: "Odeme" },
    { key: "confirm", label: "Onay" },
  ];

  const isAddressValid =
    addressForm.firstName &&
    addressForm.lastName &&
    addressForm.phone &&
    addressForm.city &&
    addressForm.district &&
    addressForm.address;

  const isCardValid =
    cardForm.holderName &&
    cardForm.number.replace(/\s/g, "").length >= 15 &&
    cardForm.expireMonth &&
    cardForm.expireYear &&
    cardForm.cvc.length >= 3;

  const formatCardNumber = (value: string) => {
    const nums = value.replace(/\D/g, "").substring(0, 16);
    return nums.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        variantId: item.variant?.id || null,
        quantity: item.quantity,
        price: getItemPrice(item),
      }));

      // 1. Siparis olustur
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderItems,
          paymentMethod,
          couponCode: couponCode || undefined,
          guestEmail: guestEmail || undefined,
          guestName: `${addressForm.firstName} ${addressForm.lastName}`,
          guestPhone: addressForm.phone,
          note: note || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Siparis olusturulamadi");

      const orderId = data.order.id;
      const orderNumber = data.order.orderNumber;

      // 2. Odeme yontemine gore islem
      if (paymentMethod === "CREDIT_CARD") {
        // iyzico 3D Secure
        const payRes = await fetch("/api/payment/iyzico", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            card: cardForm,
            installment: 1,
          }),
        });

        const payData = await payRes.json();
        if (!payRes.ok) throw new Error(payData.error || "Odeme baslatma hatasi");

        // 3D Secure HTML'ini goster
        if (payData.htmlContent) {
          clearCart();
          const decodedHtml = atob(payData.htmlContent);
          if (iframeRef.current) {
            iframeRef.current.classList.remove("hidden");
            iframeRef.current.innerHTML = "";
            const iframe = document.createElement("iframe");
            iframe.id = "iyzico-3ds";
            iframe.style.cssText = "width:100%;height:600px;border:none;border-radius:12px";
            iframe.sandbox.add("allow-forms", "allow-scripts", "allow-same-origin", "allow-top-navigation");
            iframeRef.current.appendChild(iframe);
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
              iframeDoc.open();
              iframeDoc.write(decodedHtml);
              iframeDoc.close();
            }
          }
          return;
        }
      } else {
        // Havale veya Kapida Odeme
        clearCart();

        if (paymentMethod === "BANK_TRANSFER") {
          setShowBankInfo(true);
        } else {
          router.push(`/siparis-basarili?no=${orderNumber}`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata olustu");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Havale bilgileri gosterimi
  if (showBankInfo) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-border p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏦</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Siparisiniz Alindi!</h1>
          <p className="text-muted-foreground mb-6">
            Asagidaki banka hesaplarindan birine havale/EFT yaparak odemenizi tamamlayabilirsiniz.
          </p>

          <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mb-6">
            <p className="text-sm font-medium text-warning">
              Aciklama kismina siparis numaranizi yazmayi unutmayiniz!
            </p>
          </div>

          <div className="space-y-3 text-left mb-6">
            {bankAccounts.map((bank) => (
              <div key={bank.bankName} className="p-4 bg-muted rounded-lg">
                <p className="font-bold text-sm">{bank.bankName}</p>
                <p className="text-sm text-muted-foreground mt-1">IBAN: {bank.iban}</p>
                <p className="text-sm text-muted-foreground">Hesap Sahibi: {bank.accountHolder}</p>
              </div>
            ))}
          </div>

          <div className="bg-muted rounded-lg p-4 mb-6">
            <p className="text-sm"><strong>Odenecek Tutar:</strong> <span className="text-primary font-bold">{formatPrice(total)}</span></p>
          </div>

          <Link href="/" className="inline-block px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
            Anasayfaya Don
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Odeme</h1>

      {/* 3D Secure iframe container */}
      <div ref={iframeRef} className="hidden" />

      {/* Steps */}
      <div className="flex items-center justify-between mb-8 max-w-xl mx-auto">
        {steps.map((s, idx) => (
          <div key={s.key} className="flex items-center">
            <button
              onClick={() => {
                const currentIdx = steps.findIndex((st) => st.key === step);
                if (idx <= currentIdx) setStep(s.key);
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s.key
                  ? "bg-primary text-white"
                  : steps.findIndex((st) => st.key === step) > idx
                  ? "bg-success text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {steps.findIndex((st) => st.key === step) > idx ? "✓" : idx + 1}
            </button>
            <span className={`ml-2 text-sm hidden sm:inline ${step === s.key ? "font-medium" : "text-muted-foreground"}`}>
              {s.label}
            </span>
            {idx < steps.length - 1 && <div className="w-8 sm:w-16 h-px bg-border mx-2" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Step 1: Address */}
          {step === "address" && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold mb-4">Teslimat Adresi</h2>
              <div className="mb-4">
                <label className="text-sm font-medium mb-1 block">E-posta (misafir siparis icin)</label>
                <input type="email" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="ornek@email.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium mb-1 block">Ad *</label><input type="text" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={addressForm.firstName} onChange={(e) => setAddressForm((p) => ({ ...p, firstName: e.target.value }))} /></div>
                <div><label className="text-sm font-medium mb-1 block">Soyad *</label><input type="text" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={addressForm.lastName} onChange={(e) => setAddressForm((p) => ({ ...p, lastName: e.target.value }))} /></div>
                <div className="col-span-2"><label className="text-sm font-medium mb-1 block">Telefon *</label><input type="tel" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={addressForm.phone} onChange={(e) => setAddressForm((p) => ({ ...p, phone: e.target.value }))} placeholder="05XX XXX XX XX" /></div>
                <div><label className="text-sm font-medium mb-1 block">Sehir *</label><input type="text" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={addressForm.city} onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))} /></div>
                <div><label className="text-sm font-medium mb-1 block">Ilce *</label><input type="text" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={addressForm.district} onChange={(e) => setAddressForm((p) => ({ ...p, district: e.target.value }))} /></div>
                <div className="col-span-2"><label className="text-sm font-medium mb-1 block">Adres *</label><textarea rows={3} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none" value={addressForm.address} onChange={(e) => setAddressForm((p) => ({ ...p, address: e.target.value }))} /></div>
                <div><label className="text-sm font-medium mb-1 block">Posta Kodu</label><input type="text" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={addressForm.zipCode} onChange={(e) => setAddressForm((p) => ({ ...p, zipCode: e.target.value }))} /></div>
              </div>
              <button onClick={() => setStep("shipping")} disabled={!isAddressValid} className="mt-6 w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:bg-muted disabled:text-muted-foreground transition-colors">Devam Et</button>
            </div>
          )}

          {/* Step 2: Shipping */}
          {step === "shipping" && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold mb-4">Kargo Secimi</h2>
              <div className="space-y-3">
                {[
                  { id: "standard", name: "Standart Kargo", desc: "3-5 is gunu", price: baseShippingCost },
                  { id: "express", name: "Hizli Kargo", desc: "1-2 is gunu", price: baseShippingCost + 20 },
                ].map((option) => (
                  <label key={option.id} className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${selectedShipping === option.id ? "border-primary bg-primary/5" : "border-border hover:border-primary"}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="shipping" value={option.id} checked={selectedShipping === option.id} onChange={() => setSelectedShipping(option.id)} className="w-4 h-4 text-primary" />
                      <div><p className="text-sm font-medium">{option.name}</p><p className="text-xs text-muted-foreground">{option.desc}</p></div>
                    </div>
                    <span className={`text-sm font-bold ${option.price === 0 ? "text-success" : ""}`}>{option.price === 0 ? "Ucretsiz" : formatPrice(option.price)}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4"><label className="text-sm font-medium mb-1 block">Siparis Notu (opsiyonel)</label><textarea rows={2} className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Teslimat ile ilgili notunuz..." /></div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep("address")} className="flex-1 py-3 border border-border rounded-lg text-sm font-medium hover:bg-muted">Geri</button>
                <button onClick={() => setStep("payment")} className="flex-1 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark">Devam Et</button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === "payment" && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold mb-4">Odeme Yontemi</h2>
              <div className="space-y-3">
                {[
                  { id: "CREDIT_CARD", name: "Kredi / Banka Karti", icon: "💳", desc: "Guvenli 3D Secure odeme (iyzico)" },
                  { id: "BANK_TRANSFER", name: "Havale / EFT", icon: "🏦", desc: "Banka hesabina havale" },
                  { id: "CASH_ON_DELIVERY", name: "Kapida Odeme", icon: "📦", desc: `+${formatPrice(10)} kapida odeme ucreti` },
                ].map((method) => (
                  <label key={method.id} className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${paymentMethod === method.id ? "border-primary bg-primary/5" : "border-border hover:border-primary"}`}>
                    <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} className="w-4 h-4 text-primary" />
                    <span className="text-xl">{method.icon}</span>
                    <div><p className="text-sm font-medium">{method.name}</p><p className="text-xs text-muted-foreground">{method.desc}</p></div>
                  </label>
                ))}
              </div>

              {/* Credit Card Form */}
              {paymentMethod === "CREDIT_CARD" && (
                <div className="mt-6 pt-4 border-t border-border space-y-4">
                  <h3 className="text-sm font-bold">Kart Bilgileri</h3>
                  <div><label className="text-sm font-medium mb-1 block">Kart Uzerindeki Isim</label><input type="text" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={cardForm.holderName} onChange={(e) => setCardForm((p) => ({ ...p, holderName: e.target.value.toUpperCase() }))} placeholder="AD SOYAD" /></div>
                  <div><label className="text-sm font-medium mb-1 block">Kart Numarasi</label><input type="text" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono" value={cardForm.number} onChange={(e) => setCardForm((p) => ({ ...p, number: formatCardNumber(e.target.value) }))} placeholder="0000 0000 0000 0000" maxLength={19} /></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className="text-sm font-medium mb-1 block">Ay</label><select className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={cardForm.expireMonth} onChange={(e) => setCardForm((p) => ({ ...p, expireMonth: e.target.value }))}><option value="">Ay</option>{Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => (<option key={m} value={m}>{m}</option>))}</select></div>
                    <div><label className="text-sm font-medium mb-1 block">Yil</label><select className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" value={cardForm.expireYear} onChange={(e) => setCardForm((p) => ({ ...p, expireYear: e.target.value }))}><option value="">Yil</option>{Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() + i)).map((y) => (<option key={y} value={y}>{y}</option>))}</select></div>
                    <div><label className="text-sm font-medium mb-1 block">CVC</label><input type="text" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono" value={cardForm.cvc} onChange={(e) => setCardForm((p) => ({ ...p, cvc: e.target.value.replace(/\D/g, "").substring(0, 4) }))} placeholder="000" maxLength={4} /></div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-3">
                    <span>🔒</span>
                    <span>Kart bilgileriniz iyzico altyapisi ile guvenle islenir. Bilgileriniz sunucularimizda saklanmaz.</span>
                  </div>
                </div>
              )}

              {/* Coupon */}
              <div className="mt-6 pt-4 border-t border-border">
                <label className="text-sm font-medium mb-2 block">Kupon Kodu</label>
                <div className="flex gap-2">
                  <input type="text" className="flex-1 px-3 py-2 border border-border rounded-lg text-sm" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Kupon kodunuzu girin" />
                  <button className="px-4 py-2 bg-muted rounded-lg text-sm font-medium hover:bg-border">Uygula</button>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep("shipping")} className="flex-1 py-3 border border-border rounded-lg text-sm font-medium hover:bg-muted">Geri</button>
                <button onClick={() => setStep("confirm")} disabled={paymentMethod === "CREDIT_CARD" && !isCardValid} className="flex-1 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:bg-muted disabled:text-muted-foreground">Devam Et</button>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === "confirm" && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold mb-4">Siparis Ozeti</h2>
              <div className="p-4 bg-muted rounded-lg mb-4"><p className="text-sm font-medium mb-1">Teslimat Adresi</p><p className="text-sm text-muted-foreground">{addressForm.firstName} {addressForm.lastName} - {addressForm.phone}<br />{addressForm.address}, {addressForm.district}/{addressForm.city}</p></div>
              <div className="p-4 bg-muted rounded-lg mb-4"><p className="text-sm font-medium mb-1">Odeme Yontemi</p><p className="text-sm text-muted-foreground">{paymentMethod === "CREDIT_CARD" && `Kredi Karti (**** ${cardForm.number.replace(/\s/g, "").slice(-4)})`}{paymentMethod === "BANK_TRANSFER" && "Havale / EFT"}{paymentMethod === "CASH_ON_DELIVERY" && "Kapida Odeme"}</p></div>
              <div className="space-y-3 mb-4">
                {items.map((item) => {
                  const price = getItemPrice(item);
                  return (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                      <div className="w-12 h-12 bg-muted rounded overflow-hidden shrink-0">{item.product.image && <img src={item.product.image} alt="" className="w-full h-full object-cover" />}</div>
                      <div className="flex-1 min-w-0"><p className="truncate">{item.product.name}</p><p className="text-xs text-muted-foreground">{item.quantity} adet</p></div>
                      <span className="font-medium">{formatPrice(price * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>
              {error && <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg mb-4">{error}</div>}
              <div className="flex gap-3">
                <button onClick={() => setStep("payment")} className="flex-1 py-3 border border-border rounded-lg text-sm font-medium hover:bg-muted">Geri</button>
                <button onClick={handleSubmitOrder} disabled={isSubmitting} className="flex-1 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50">{isSubmitting ? "Isleniyor..." : `Siparisi Onayla (${formatPrice(total)})`}</button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-border p-6 sticky top-24">
            <h3 className="font-bold mb-4">Siparis ({items.length} urun)</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pb-4 border-b border-border">
              {items.map((item) => {
                const price = getItemPrice(item);
                return (
                  <div key={item.id} className="flex gap-2 text-sm">
                    <div className="w-10 h-10 bg-muted rounded shrink-0 overflow-hidden">{item.product.image && <img src={item.product.image} alt="" className="w-full h-full object-cover" />}</div>
                    <div className="flex-1 min-w-0"><p className="truncate text-xs">{item.product.name}</p><p className="text-xs text-muted-foreground">{item.quantity}x {formatPrice(price)}</p></div>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2 py-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Ara Toplam</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Kargo</span><span className={shippingCost === 0 ? "text-success font-medium" : ""}>{shippingCost === 0 ? "Ucretsiz" : formatPrice(shippingCost)}</span></div>
              {codFee > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Kapida Odeme</span><span>{formatPrice(codFee)}</span></div>}
            </div>
            <div className="flex justify-between pt-4 border-t border-border"><span className="font-bold text-lg">Toplam</span><span className="font-bold text-lg text-primary">{formatPrice(total)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
