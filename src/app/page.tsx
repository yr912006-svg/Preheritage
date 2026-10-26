import HeroBanner from "@/components/home/HeroBanner";
import CulturalStory from "@/components/home/CulturalStory";
import ShopByCategory from "@/components/home/ShopByCategory";
import ShopByRegion from "@/components/home/ShopByRegion";
import BestSellers from "@/components/home/BestSellers";
import Testimonials from "@/components/home/Testimonials";
import SocialFeed from "@/components/home/SocialFeed";

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <CulturalStory />
      <ShopByCategory />
      <BestSellers />
      <ShopByRegion />
      <Testimonials />
      <SocialFeed />
    </>
  );
}
