import Casino from './pages/Casino';
import Admin from './pages/Admin';
import HouseControls from './pages/HouseControls';
import BTCStore from './pages/BTCStore';
import GameGallery from './pages/GameGallery';
import PlayGame from './pages/PlayGame';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import GamblingDisclaimer from './pages/GamblingDisclaimer';
import Jurisdiction from './pages/Jurisdiction';
import Fairness from './pages/Fairness';
import HowToPlay from './pages/HowToPlay';
import HowBettingWorks from './pages/HowBettingWorks';
import ResponsiblePlay from './pages/ResponsiblePlay';
import CryptoDisclosure from './pages/CryptoDisclosure';
import Support from './pages/Support';
import BTCPaySetup from './pages/BTCPaySetup';
import PlayerProfile from './pages/PlayerProfile';
import Referrals from './pages/Referrals';
import GameStandards from './pages/GameStandards';
import DevOpsTest from './pages/DevOpsTest';
import UserProfile from './pages/UserProfile';
import VIPStatus from './pages/VIPStatus';
import Home from './pages/Home';
import GamePage from './pages/GamePage';
import Leaderboards from './pages/Leaderboards';
import Announcements from './pages/Announcements';
import Receipt from './pages/Receipt';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Casino": Casino,
    "Admin": Admin,
    "HouseControls": HouseControls,
    "BTCStore": BTCStore,
    "GameGallery": GameGallery,
    "PlayGame": PlayGame,
    "PrivacyPolicy": PrivacyPolicy,
    "TermsOfUse": TermsOfUse,
    "GamblingDisclaimer": GamblingDisclaimer,
    "Jurisdiction": Jurisdiction,
    "Fairness": Fairness,
    "HowToPlay": HowToPlay,
    "HowBettingWorks": HowBettingWorks,
    "ResponsiblePlay": ResponsiblePlay,
    "CryptoDisclosure": CryptoDisclosure,
    "Support": Support,
    "BTCPaySetup": BTCPaySetup,
    "PlayerProfile": PlayerProfile,
    "Referrals": Referrals,
    "GameStandards": GameStandards,
    "DevOpsTest": DevOpsTest,
    "UserProfile": UserProfile,
    "VIPStatus": VIPStatus,
    "Home": Home,
    "GamePage": GamePage,
    "Leaderboards": Leaderboards,
    "Announcements": Announcements,
    "Receipt": Receipt,
}

export const pagesConfig = {
    mainPage: "Casino",
    Pages: PAGES,
    Layout: __Layout,
};