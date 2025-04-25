import ReceiptClient from "./ReceiptClient";

// This file is a server component. All client logic is now in ReceiptClient.

interface PageProps {
  params: { id: string }
}

export default function ReceiptPage({ params }: PageProps) {
  return <ReceiptClient id={params.id} />;
}

export async function generateStaticParams() {
  return [];
}