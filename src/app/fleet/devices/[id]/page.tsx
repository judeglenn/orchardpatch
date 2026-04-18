"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FleetDeviceRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/devices/${id}`);
  }, [id, router]);

  return null;
}
