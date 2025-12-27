import Casino from './pages/Casino';
import Admin from './pages/Admin';
import Store from './pages/Store';
import HouseControls from './pages/HouseControls';
import BTCStore from './pages/BTCStore';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Casino": Casino,
    "Admin": Admin,
    "Store": Store,
    "HouseControls": HouseControls,
    "BTCStore": BTCStore,
}

export const pagesConfig = {
    mainPage: "Casino",
    Pages: PAGES,
    Layout: __Layout,
};