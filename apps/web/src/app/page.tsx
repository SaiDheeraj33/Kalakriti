import { Hero } from "@/components/site/hero";
import { CategoryGrid } from "@/components/site/category-grid";
import { ArtisanBand } from "@/components/site/artisan-band";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryGrid />
      <ArtisanBand />
    </>
  );
}
