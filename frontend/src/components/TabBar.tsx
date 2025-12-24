// src/components/TabBar.tsx
import "./TabBar.css";

interface Tab {
    id: string;
    label: string;
}

interface Props {
    tabs: Tab[];
    activeTab: string;
    onTabClick: (id: string) => void;
}

export function TabBar({ tabs, activeTab, onTabClick }: Props) {
    return (
        <div className="tab-bar">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
                    onClick={() => onTabClick(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
