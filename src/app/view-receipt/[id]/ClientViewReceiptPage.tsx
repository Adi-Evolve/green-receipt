"use client";

import React from "react";
import ReceiptView from "./ReceiptView";

interface ClientViewReceiptPageProps {
  id: string;
}

const ClientViewReceiptPage: React.FC<ClientViewReceiptPageProps> = ({ id }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-8">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-6">
        <ReceiptView id={id} />
      </div>
    </div>
  );
};

export default ClientViewReceiptPage;
