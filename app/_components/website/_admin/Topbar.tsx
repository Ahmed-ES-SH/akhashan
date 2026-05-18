"use client";
import Image from "next/image";
import UserButton from "./UserButton";

///////////////////////////////////////////////////////////////////////
/////////////// Admin Topbar — logo + user dropdown ///////////////////
///////////////////////////////////////////////////////////////////////

export default function Topbar() {
  return (
    <header
      className="border-b border-gray-200 bg-white px-6 py-4"
      aria-label="Admin navigation"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Image src={"/logo.png"} alt="Logo" width={100} height={50} />
        <UserButton />
      </div>
    </header>
  );
}
