"use client";
import Topbar from "@/app/_components/website/_admin/Topbar";
import React from "react";
import { AuthProvider } from "@/app/contexts/AuthContext";
import { useParams } from "next/navigation";

export default function Adminlayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const locale = (params?.locale as string) ?? "ar";

  return (
    <AuthProvider locale={locale}>
      <div>
        <Topbar />
        {children}
      </div>
    </AuthProvider>
  );
}
