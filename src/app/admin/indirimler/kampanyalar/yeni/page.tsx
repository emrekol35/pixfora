export const dynamic = "force-dynamic";

import CampaignForm from "../CampaignForm";

export default function NewCampaignPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Yeni Kampanya</h1>
      <CampaignForm />
    </div>
  );
}
