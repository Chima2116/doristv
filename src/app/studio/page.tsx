import { Suspense } from "react";
import { CreatorStudio } from "@/components/studio/CreatorStudio";

export default function StudioPage() {
  return (
    <Suspense fallback={null}>
      <CreatorStudio />
    </Suspense>
  );
}
