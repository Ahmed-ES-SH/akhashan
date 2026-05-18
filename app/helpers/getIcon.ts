import * as FaIcons from "react-icons/fa";

export const getIcon = (iconName: string) => {
  return FaIcons[iconName as keyof typeof FaIcons] || FaIcons.FaQuestionCircle;
};
