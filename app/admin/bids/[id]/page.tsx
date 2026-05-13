import AdminBidDetailPage from "@/components/admin/AdminBidDetailPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminBidDetailPage bidId={id} />;
}
