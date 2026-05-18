export type AdminTabId = "overview" | "categories" | "websites" | "publish";

const tabs: Array<{ id: AdminTabId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "categories", label: "Categories" },
  { id: "websites", label: "Websites" },
  { id: "publish", label: "Publish" },
];

type AdminTabsProps = {
  activeTab: AdminTabId;
  onChange: (tab: AdminTabId) => void;
};

export function AdminTabs({ activeTab, onChange }: AdminTabsProps) {
  return (
    <nav className="admin-tabs" aria-label="Admin sections">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`admin-tabs__button${tab.id === activeTab ? " is-active" : ""}`}
          aria-pressed={tab.id === activeTab}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
