import type { CommercialLocationProfile } from "./commercial-location.types.js";
import { saveCommercialLocationProfile } from "./commercial-location-storage.js";

export function inferLocationFromPhone(phone: string, actorId: string): CommercialLocationProfile {
  const digits = phone.replace(/\D/g, "");
  let country = "Côte d'Ivoire";
  let city = "Abidjan";
  let region = "Lagunes";
  if (digits.startsWith("225")) {
    country = "Côte d'Ivoire";
  }
  return saveCommercialLocationProfile({
    actorId,
    city,
    region,
    country,
    sourceType: "SYSTEM_INFERRED",
    updatedAt: new Date().toISOString(),
  });
}
