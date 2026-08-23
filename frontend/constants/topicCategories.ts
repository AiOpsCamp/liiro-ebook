import {
  BookOpen,
  Scroll as ScrollIcon,
  MessageCircle,
  Clock3,
  Users,
  MapPin,
  Plane,
  Bus,
  UtensilsCrossed,
  ShoppingBag,
  Shirt,
  DollarSign,
  Briefcase,
  Landmark,
  MonitorSmartphone,
  Heart,
  Dumbbell,
  Shield,
  Wrench,
  House,
  Building2,
  GraduationCap,
  Languages,
  Gamepad2,
  Palette,
  FlaskConical,
  CloudSun,
  TreePine,
  LayoutGrid,
  Camera,
  Quote,
  Tv,
  Smile,
} from "lucide-react-native";
import type { ComponentType } from "react";

export type TopicCategory =
  | "Basics"
  | "Grammar"
  | "Communication"
  | "Time"
  | "People"
  | "Locations"
  | "Travel"
  | "Transport"
  | "Food"
  | "Shopping"
  | "Fashion"
  | "Money"
  | "Work"
  | "Business"
  | "Technology"
  | "Health"
  | "Fitness"
  | "Safety"
  | "Services"
  | "Home"
  | "Housing"
  | "Education"
  | "Politics"
  | "Culture"
  | "Gaming"
  | "Art"
  | "History"
  | "Science"
  | "Weather"
  | "Environment"
  | "Hobbies"
  | "Idioms"
  | "Media"
  | "Emotions";

type IconCmp = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export const TOPIC_CATEGORIES: TopicCategory[] = [
  "Basics",
  "Grammar",
  "Communication",
  "Time",
  "People",
  "Locations",
  "Travel",
  "Transport",
  "Food",
  "Shopping",
  "Fashion",
  "Money",
  "Work",
  "Business",
  "Technology",
  "Health",
  "Fitness",
  "Safety",
  "Services",
  "Home",
  "Housing",
  "Education",
  "Politics",
  "Culture",
  "Gaming",
  "Art",
  "History",
  "Science",
  "Weather",
  "Environment",
  "Hobbies",
  "Idioms",
  "Media",
  "Emotions",
];

export const TOPIC_CATEGORY_ICONS: Record<TopicCategory, IconCmp> = {
  Basics: BookOpen,
  Grammar: ScrollIcon,
  Communication: MessageCircle,
  Time: Clock3,
  People: Users,
  Locations: MapPin,
  Travel: Plane,
  Transport: Bus,
  Food: UtensilsCrossed,
  Shopping: ShoppingBag,
  Fashion: Shirt,
  Money: DollarSign,
  Work: Briefcase,
  Business: Landmark,
  Technology: MonitorSmartphone,
  Health: Heart,
  Fitness: Dumbbell,
  Safety: Shield,
  Services: Wrench,
  Home: House,
  Housing: Building2,
  Education: GraduationCap,
  Politics: Landmark,
  Culture: Languages,
  Gaming: Gamepad2,
  Art: Palette,
  History: ScrollIcon,
  Science: FlaskConical,
  Weather: CloudSun,
  Environment: TreePine,
  Hobbies: Camera,
  Idioms: Quote,
  Media: Tv,
  Emotions: Smile,
};

export const getTopicCategoryIcon = (name: string): IconCmp => {
  return TOPIC_CATEGORY_ICONS[name as TopicCategory] ?? LayoutGrid;
};
