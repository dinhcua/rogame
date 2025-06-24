import SteamIcon from "../assets/platforms/steam.svg";
import EpicIcon from "../assets/platforms/epic.svg";
import GogIcon from "../assets/platforms/gog.svg";

interface PlatformIconProps {
  platform: string;
  className?: string;
}

const PlatformIcon = ({
  platform,
  className = "w-5 h-5",
}: PlatformIconProps) => {
  switch (platform) {
    case "Steam":
      return <img src={SteamIcon} alt="Steam" className={className} />;
    case "Epic Games":
      return <img src={EpicIcon} alt="Epic Games" className={className} />;
    case "GOG":
      return <img src={GogIcon} alt="GOG" className={className} />;
    default:
      return null;
  }
};

export default PlatformIcon;
