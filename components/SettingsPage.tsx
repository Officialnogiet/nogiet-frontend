import React, { useCallback, useRef } from 'react';
import { Settings, Bell, Shield, Globe, Palette, X } from 'lucide-react';
import { useDashboardStore } from '../src/stores/dashboard.store';
import { useSettingsStore } from '../src/stores/settings.store';
import { useSetAlertThreshold, useSetEmailAlerts } from '../src/hooks/useEmissions';

interface SettingsPageProps {
  darkMode?: boolean;
  onClose?: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ darkMode = true, onClose }) => {
  const { toggleDarkMode } = useDashboardStore();
  const settings = useSettingsStore();
  const setThresholdMut = useSetAlertThreshold();
  const setEmailMut = useSetEmailAlerts();
  const thresholdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEmailToggle = useCallback(() => {
    const next = !settings.emailAlerts;
    settings.setEmailAlerts(next);
    setEmailMut.mutate(next);
  }, [settings.emailAlerts]);

  const handlePushToggle = useCallback(() => {
    const next = !settings.pushNotifications;
    settings.setPushNotifications(next);
    if (next && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [settings.pushNotifications]);

  const handleThresholdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (val < 1) return;
    settings.setAlertThreshold(val);
    if (thresholdTimer.current) clearTimeout(thresholdTimer.current);
    thresholdTimer.current = setTimeout(() => {
      setThresholdMut.mutate(val);
    }, 800);
  }, []);

  return (
    <div className={`flex-1 overflow-y-auto p-10 transition-colors duration-300 ${darkMode ? 'bg-[#0b0e14]' : 'bg-gray-50'}`}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-[#009688]/10' : 'bg-teal-50'}`}>
            <Settings className="text-[#009688]" size={28} />
          </div>
          <div className="flex-1">
            <h1 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Settings</h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Configure your application preferences</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${darkMode ? 'hover:bg-[#1e2430] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}
            >
              <X size={22} />
            </button>
          )}
        </div>

        <div className="space-y-6">
          <SettingsSection title="Appearance" icon={<Palette size={20} />} darkMode={darkMode}>
            <SettingsRow darkMode={darkMode} label="Dark Mode" description="Use dark theme across the application">
              <ToggleSwitch on={darkMode} onToggle={toggleDarkMode} />
            </SettingsRow>
          </SettingsSection>

          <SettingsSection title="Notifications" icon={<Bell size={20} />} darkMode={darkMode}>
            <SettingsRow darkMode={darkMode} label="Email Alerts" description="Receive email notifications for critical emissions">
              <ToggleSwitch on={settings.emailAlerts} onToggle={handleEmailToggle} />
            </SettingsRow>
            <SettingsRow darkMode={darkMode} label="Push Notifications" description="Get browser push notifications for new alerts">
              <ToggleSwitch on={settings.pushNotifications} onToggle={handlePushToggle} />
            </SettingsRow>
            <SettingsRow darkMode={darkMode} label="Auto-alert Threshold" description="Minimum emission rate (kg/hr) to trigger automatic alerts" last>
              <input
                type="number"
                value={settings.alertThreshold}
                onChange={handleThresholdChange}
                min={1}
                className={`w-24 px-4 py-2 rounded-xl border text-sm font-bold text-center ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              />
            </SettingsRow>
          </SettingsSection>

          <SettingsSection title="Data & Privacy" icon={<Shield size={20} />} darkMode={darkMode}>
            <SettingsRow darkMode={darkMode} label="Data Retention" description="How long to keep cached satellite data">
              <select
                value={settings.dataRetention}
                onChange={(e) => settings.setDataRetention(e.target.value)}
                className={`px-4 py-2 rounded-xl border text-sm font-bold ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              >
                <option>24 hours</option>
                <option>3 days</option>
                <option>7 days</option>
              </select>
            </SettingsRow>
            <SettingsRow darkMode={darkMode} label="Export Format" description="Default format for data exports" last>
              <select
                value={settings.exportFormat}
                onChange={(e) => settings.setExportFormat(e.target.value)}
                className={`px-4 py-2 rounded-xl border text-sm font-bold ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              >
                <option>CSV</option>
                <option>JSON</option>
                <option>PDF</option>
              </select>
            </SettingsRow>
          </SettingsSection>

          <SettingsSection title="Map & Region" icon={<Globe size={20} />} darkMode={darkMode}>
            <SettingsRow darkMode={darkMode} label="Default Region" description="Map center on application load">
              <select
                value={settings.defaultRegion}
                onChange={(e) => settings.setDefaultRegion(e.target.value)}
                className={`px-4 py-2 rounded-xl border text-sm font-bold ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              >
                <optgroup label="Nigeria">
                  <option>Nigeria (Full)</option>
                  <option>Niger Delta</option>
                  <option>Lagos Region</option>
                  <option>South South</option>
                  <option>South West</option>
                  <option>South East</option>
                  <option>North Central</option>
                  <option>North East</option>
                  <option>North West</option>
                </optgroup>
                <optgroup label="Continental">
                  <option>West Africa</option>
                  <option>East Africa</option>
                  <option>North Africa</option>
                  <option>Southern Africa</option>
                  <option>Africa</option>
                </optgroup>
                <optgroup label="Global">
                  <option>World</option>
                </optgroup>
              </select>
            </SettingsRow>
            <SettingsRow darkMode={darkMode} label="Map Style" description="Default map tile style" last>
              <select
                value={settings.mapStyle}
                onChange={(e) => settings.setMapStyle(e.target.value as "dark" | "light" | "satellite")}
                className={`px-4 py-2 rounded-xl border text-sm font-bold ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white' : 'bg-white border-gray-200 text-gray-900'}`}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="satellite">Satellite</option>
              </select>
            </SettingsRow>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
};

const SettingsSection: React.FC<{ title: string; icon: React.ReactNode; darkMode: boolean; children: React.ReactNode }> = ({ title, icon, darkMode, children }) => (
  <div className={`rounded-3xl border overflow-hidden ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100'}`}>
    <div className={`px-8 py-5 border-b flex items-center gap-3 ${darkMode ? 'border-[#1e2430]' : 'border-gray-100'}`}>
      <span className="text-[#009688]">{icon}</span>
      <h2 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
    </div>
    <div>{children}</div>
  </div>
);

const SettingsRow: React.FC<{ darkMode: boolean; label: string; description: string; children: React.ReactNode; last?: boolean }> = ({ darkMode, label, description, children, last }) => (
  <div className={`px-8 py-5 flex items-center justify-between ${!last ? `border-b ${darkMode ? 'border-[#1e2430]/50' : 'border-gray-50'}` : ''}`}>
    <div>
      <p className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{label}</p>
      <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{description}</p>
    </div>
    {children}
  </div>
);

const ToggleSwitch: React.FC<{ on: boolean; onToggle: () => void }> = ({ on, onToggle }) => (
  <button onClick={onToggle} className={`w-12 h-6 rounded-full relative transition-colors ${on ? 'bg-[#009688]' : 'bg-gray-700'}`}>
    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${on ? 'left-7' : 'left-1'}`} />
  </button>
);

export default SettingsPage;
