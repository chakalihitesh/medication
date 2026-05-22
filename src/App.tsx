import { useState } from 'react';
import { Screen } from './types';
import { Splash } from './screens/Splash';
import { Login } from './screens/Login';
import { Home } from './screens/Home';
import { Meds } from './screens/Meds';
import { AddMed } from './screens/AddMed';
import { Assistant } from './screens/Assistant';
import { Reports } from './screens/Reports';
import { Profile } from './screens/Profile';
import { Family } from './screens/Family';
import { PersonalInfo } from './screens/PersonalInfo';
import { EditProfile } from './screens/EditProfile';
import { BottomNav } from './components/BottomNav';
import { TopBar } from './components/TopBar';

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');

  if (screen === 'splash') {
    return <Splash onComplete={() => setScreen('login')} />;
  }

  if (screen === 'login') {
    return <Login onLogin={() => setScreen('home')} />;
  }

  // Derive TopBar props from screen state
  let topBarProps = {};
  switch (screen) {
    case 'add-med':
      topBarProps = { title: "Add New Medication", showBack: true, onBack: () => setScreen('meds') };
      break;
    case 'family':
      topBarProps = { title: "FAMILY HEALTH", showBack: true, onBack: () => setScreen('profile') };
      break;
    case 'personal-info':
      topBarProps = { title: "personal Info", showBack: true, onBack: () => setScreen('profile'), showAvatar: true };
      break;
    case 'edit-profile':
      topBarProps = { title: "Edit Profile", showBack: true, onBack: () => setScreen('profile'), showAvatar: true };
      break;
    case 'meds':
      topBarProps = { title: "My Medications", showMenu: true };
      break;
    default:
      // Home, Assistant, Reports, Profile
      topBarProps = { title: "HealthMate AI" };
      break;
  }

  const renderScreen = () => {
    switch (screen) {
      case 'home': return <Home setScreen={setScreen} />;
      case 'meds': return <Meds setScreen={setScreen} />;
      case 'add-med': return <AddMed setScreen={setScreen} />;
      case 'assistant': return <Assistant />;
      case 'reports': return <Reports />;
      case 'profile': return <Profile setScreen={setScreen} />;
      case 'family': return <Family />;
      case 'personal-info': return <PersonalInfo />;
      case 'edit-profile': return <EditProfile setScreen={setScreen} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] max-h-[100dvh] overflow-hidden bg-surface">
      <TopBar {...topBarProps} />
      
      <main className="flex-1 overflow-y-auto px-5 py-6">
        {renderScreen()}
      </main>

      {/* Bottom Nav visibility */}
      {['home', 'meds', 'assistant', 'reports', 'profile'].includes(screen) && (
        <BottomNav currentScreen={screen} setScreen={setScreen} />
      )}
    </div>
  );
}
