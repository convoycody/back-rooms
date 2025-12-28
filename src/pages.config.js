import Admin from './pages/Admin';
import AnnouncementDetail from './pages/AnnouncementDetail';
import Announcements from './pages/Announcements';
import BTCPaySetup from './pages/BTCPaySetup';
import BTCStore from './pages/BTCStore';
import CryptoDisclosure from './pages/CryptoDisclosure';
import DevOpsTest from './pages/DevOpsTest';
import Fairness from './pages/Fairness';
import GamblingDisclaimer from './pages/GamblingDisclaimer';
import GameGallery from './pages/GameGallery';
import GamePage from './pages/GamePage';
import GameSettings from './pages/GameSettings';
import GameStandards from './pages/GameStandards';
import Home from './pages/Home';
import HouseControls from './pages/HouseControls';
import HowBettingWorks from './pages/HowBettingWorks';
import HowToPlay from './pages/HowToPlay';
import Jurisdiction from './pages/Jurisdiction';
import LargeWinnings from './pages/LargeWinnings';
import Leaderboards from './pages/Leaderboards';
import Moderation from './pages/Moderation';
import PlayGame from './pages/PlayGame';
import PlayerProfile from './pages/PlayerProfile';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Receipt from './pages/Receipt';
import Referrals from './pages/Referrals';
import ResponsiblePlay from './pages/ResponsiblePlay';
import ScratchersMetrics from './pages/ScratchersMetrics';
import Settings from './pages/Settings';
import Support from './pages/Support';
import TermsOfUse from './pages/TermsOfUse';
import UserProfile from './pages/UserProfile';
import VIPStatus from './pages/VIPStatus';
import Vault from './pages/Vault';
import Wallet from './pages/Wallet';
import VaultTickets from './pages/VaultTickets';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "AnnouncementDetail": AnnouncementDetail,
    "Announcements": Announcements,
    "BTCPaySetup": BTCPaySetup,
    "BTCStore": BTCStore,
    "CryptoDisclosure": CryptoDisclosure,
    "DevOpsTest": DevOpsTest,
    "Fairness": Fairness,
    "GamblingDisclaimer": GamblingDisclaimer,
    "GameGallery": GameGallery,
    "GamePage": GamePage,
    "GameSettings": GameSettings,
    "GameStandards": GameStandards,
    "Home": Home,
    "HouseControls": HouseControls,
    "HowBettingWorks": HowBettingWorks,
    "HowToPlay": HowToPlay,
    "Jurisdiction": Jurisdiction,
    "LargeWinnings": LargeWinnings,
    "Leaderboards": Leaderboards,
    "Moderation": Moderation,
    "PlayGame": PlayGame,
    "PlayerProfile": PlayerProfile,
    "PrivacyPolicy": PrivacyPolicy,
    "Receipt": Receipt,
    "Referrals": Referrals,
    "ResponsiblePlay": ResponsiblePlay,
    "ScratchersMetrics": ScratchersMetrics,
    "Settings": Settings,
    "Support": Support,
    "TermsOfUse": TermsOfUse,
    "UserProfile": UserProfile,
    "VIPStatus": VIPStatus,
    "Vault": Vault,
    "Wallet": Wallet,
    "VaultTickets": VaultTickets,
}

export const pagesConfig = {
    mainPage: "Admin",
    Pages: PAGES,
    Layout: __Layout,
};