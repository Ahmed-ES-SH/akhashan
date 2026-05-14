import {
  FiUsers,
  FiMapPin,
  FiClock,
  FiStar,
  FiBriefcase,
  FiSettings,
  FiShield,
  FiCheckCircle,
  FiMail,
  FiPhone,
  FiMessageCircle,
  FiHeart,
  FiTool,
  FiTruck,
  FiSun,
  FiGlobe,
  FiAward,
  FiCalendar,
  FiTrendingUp,
  FiClipboard,
  FiArrowRight,
} from "react-icons/fi";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FiUsers,
  FiMapPin,
  FiClock,
  FiStar,
  FiBriefcase,
  FiSettings,
  FiShield,
  FiCheckCircle,
  FiMail,
  FiPhone,
  FiMessageCircle,
  FiHeart,
  FiTool,
  FiTruck,
  FiSun,
  FiGlobe,
  FiAward,
  FiCalendar,
  FiTrendingUp,
  FiClipboard,
  FiArrowRight,
};

interface IconProps {
  name: string;
  className?: string;
}

export default function Icon({ name, className = "w-5 h-5" }: IconProps) {
  const IconComponent = iconMap[name];
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
}
