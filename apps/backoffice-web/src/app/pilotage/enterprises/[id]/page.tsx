import { BackofficeEnterpriseDetail } from "@/pilotage/modules/BackofficeOperationalModules";

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <BackofficeEnterpriseDetail id={id} />;
}
