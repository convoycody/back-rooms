import Casino from './pages/Casino';
import Admin from './pages/Admin';
import Store from './pages/Store';
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
import __Layout from './Layout.jsx';


export const PAGES = {
    "Casino": Casino,
    "Admin": Admin,
    "Store": Store,
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
}

export const pagesConfig = {
    mainPage: "Casino",
    Pages: PAGES,
    Layout: __Layout,
};