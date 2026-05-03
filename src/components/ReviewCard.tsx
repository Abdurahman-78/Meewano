import { Star, BadgeCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ReviewCardProps {
  author: string;
  rating: number;
  date: string;
  text: string;
  verified?: boolean;
}

const ReviewCard = ({ author, rating, date, text, verified = false }: ReviewCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {author.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="font-bold">{author}</h4>
                {verified && (
                  <BadgeCheck className="h-4 w-4 text-primary" aria-label="Verified guest" />
                )}
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{date}</p>
            <p className="text-muted-foreground">{text}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;
