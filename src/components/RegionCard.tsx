import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface RegionCardProps {
  name: string;
  description: string;
  image: string;
  propertyCount: number;
  onClick: () => void;
}

const RegionCard = ({ name, description, image, propertyCount, onClick }: RegionCardProps) => {
  return (
    <Card 
      className="overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-2xl font-bold mb-1">{name}</h3>
          <div className="flex items-center gap-1 text-sm">
            <MapPin className="h-4 w-4" />
            <span>{propertyCount} properties</span>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
};

export default RegionCard;
