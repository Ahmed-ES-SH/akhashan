import { AdminGate } from "./AdminGate";

// ///////////////////////////////////////////////////////////////////////
// ///////////// Admin Page Client — wraps AdminGate with AuthProvider ///
// ///////////////////////////////////////////////////////////////////////

export default function AdminPageClient({
  data,
}: {
  locale: "en" | "ar";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}) {
  return <AdminGate data={data} />;
}
