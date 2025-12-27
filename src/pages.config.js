import Casino from './pages/Casino';
import Admin from './pages/Admin';
import Store from './pages/Store';
import HouseControls from './pages/HouseControls';
import BTCStore from './pages/BTCStore';
import GameGallery from './pages/GameGallery';
import PlayGame from './pages/PlayGame';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Casino": Casino,
    "Admin": Admin,
    "Store": Store,
    "HouseControls": HouseControls,
    "BTCStore": BTCStore,
    "GameGallery": GameGallery,
    "PlayGame": PlayGame,
}

export const pagesConfig = {
    mainPage: "Casino",
    Pages: PAGES,
    Layout: __Layout,
};