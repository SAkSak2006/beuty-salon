interface Tab {
  key: string;
  label: string;
  icon?: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
}

export default function TabBar({ tabs, activeTab, onChange }: TabBarProps) {
  return (
    <div className="flex border-b mb-6 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === tab.key
              ? 'text-pink-500 border-pink-500'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          {tab.icon && <i className={tab.icon} />}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
