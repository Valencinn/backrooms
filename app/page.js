/**
 * Entrada del explorador. Este Server Component delega estado y DOM
 * al Client Component BackroomsExplorer.
 */
import BackroomsExplorer from "@/components/backrooms/BackroomsExplorer";

export default function Home() {
  return <BackroomsExplorer />;
}
