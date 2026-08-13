import type { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabViewProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function TabView({ tabs, activeTab, onTabChange }: TabViewProps) {
  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className="tab-view">
      <div className="tab-view__tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-view__tab ${tab.id === activeTab ? 'tab-view__tab--active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            id={`tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-view__content">{activeContent}</div>
    </div>
  );
}
