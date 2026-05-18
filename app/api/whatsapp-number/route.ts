import { NextResponse } from "next/server";
import { fetchHomePageContent } from "@/app/helpers/api/publicApi";

export async function GET() {
  try {
    const homeContent = await fetchHomePageContent("en");
    const whatsappNumber = homeContent.hero?.whatsapp_number ?? null;

    return NextResponse.json({ whatsapp_number: whatsappNumber });
  } catch {
    return NextResponse.json({ whatsapp_number: null });
  }
}
