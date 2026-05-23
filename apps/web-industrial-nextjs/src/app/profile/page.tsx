import { VenextCommercialIdSection } from "@/components/profile/venext-commercial-id-section";

/**
 * Demo profile surface — production would bind `commercialId` from session / org API.
 */
export default function ProfilePage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-vxlg px-vxlg py-vxxl">
      <h1 className="text-2xl font-semibold text-vx-ink">Profile</h1>
      <VenextCommercialIdSection commercialId="4829173056" locale="en" />
      <VenextCommercialIdSection commercialId="4829173056" locale="fr" />
    </main>
  );
}
