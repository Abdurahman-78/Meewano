import { useState } from "react";
import {
  User, Cat, Dog, Bird, Fish, Rabbit, Squirrel, Turtle,
  Smile, Star, Heart, Flame, Coffee, Music, Camera, Rocket,
  Mountain, Sun, Moon, Cloud, Leaf, TreePine, Flower, Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Curated icon set users can pick from. Each entry stores a short id we save
// to profiles.avatar_url as `icon:<id>` so we don't need extra columns.
export const AVATAR_ICONS = [
  { id: "user", Icon: User },
  { id: "smile", Icon: Smile },
  { id: "star", Icon: Star },
  { id: "heart", Icon: Heart },
  { id: "flame", Icon: Flame },
  { id: "crown", Icon: Crown },
  { id: "rocket", Icon: Rocket },
  { id: "camera", Icon: Camera },
  { id: "music", Icon: Music },
  { id: "coffee", Icon: Coffee },
  { id: "sun", Icon: Sun },
  { id: "moon", Icon: Moon },
  { id: "cloud", Icon: Cloud },
  { id: "mountain", Icon: Mountain },
  { id: "leaf", Icon: Leaf },
  { id: "tree", Icon: TreePine },
  { id: "flower", Icon: Flower },
  { id: "cat", Icon: Cat },
  { id: "dog", Icon: Dog },
  { id: "bird", Icon: Bird },
  { id: "fish", Icon: Fish },
  { id: "rabbit", Icon: Rabbit },
  { id: "squirrel", Icon: Squirrel },
  { id: "turtle", Icon: Turtle },
] as const;

const ICON_PREFIX = "icon:";

export const isIconAvatar = (value: string | null | undefined) =>
  !!value && value.startsWith(ICON_PREFIX);

export const getIconAvatarId = (value: string | null | undefined) => {
  if (!isIconAvatar(value)) return null;
  return value!.slice(ICON_PREFIX.length);
};

export const buildIconAvatarValue = (id: string) => `${ICON_PREFIX}${id}`;

export const renderAvatarIcon = (
  value: string | null | undefined,
  className = "h-5 w-5"
) => {
  const id = getIconAvatarId(value);
  const entry = AVATAR_ICONS.find((a) => a.id === id) ?? AVATAR_ICONS[0];
  const Icon = entry.Icon;
  return <Icon className={className} />;
};

interface AvatarIconPickerProps {
  value: string | null;
  onChange: (newValue: string) => void;
}

const AvatarIconPicker = ({ value, onChange }: AvatarIconPickerProps) => {
  const [selected, setSelected] = useState<string>(getIconAvatarId(value) ?? "user");

  const handleSelect = (id: string) => {
    setSelected(id);
    onChange(buildIconAvatarValue(id));
  };

  return (
    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
      {AVATAR_ICONS.map(({ id, Icon }) => {
        const isActive = selected === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => handleSelect(id)}
            className={cn(
              "aspect-square rounded-full flex items-center justify-center border-2 transition-all",
              isActive
                ? "border-primary bg-primary text-primary-foreground scale-105"
                : "border-border bg-muted text-muted-foreground hover:border-primary/50"
            )}
            aria-label={`Select ${id} avatar`}
          >
            <Icon className="h-5 w-5" />
          </button>
        );
      })}
    </div>
  );
};

export default AvatarIconPicker;
