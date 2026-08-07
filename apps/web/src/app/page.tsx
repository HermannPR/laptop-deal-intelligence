import { Dashboard } from "@/components/dashboard";
import { getListings } from "@/lib/listings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { listings, demo } = await getListings();
  return <Dashboard initialListings={listings} demo={demo} />;
}

