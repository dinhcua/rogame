import SteamIcon from "../assets/platforms/steam.svg";
import EpicIcon from "../assets/platforms/epic.svg";
import GogIcon from "../assets/platforms/gog.svg";
import GoogleDriveIcon from "../assets/platforms/google_drive.svg";
import DropboxIcon from "../assets/platforms/dropbox.svg";
import OnedriveIcon from "../assets/platforms/onedrive.svg";

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
    case "google_drive":
      return (
        <img src={GoogleDriveIcon} alt="Google Drive" className={className} />
      );
    case "dropbox":
      return <img src={DropboxIcon} alt="Dropbox" className={className} />;
    case "onedrive":
      return <img src={OnedriveIcon} alt="OneDrive" className={className} />;
    default:
      return null;
  }
};

export default PlatformIcon;
