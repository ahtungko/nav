import { getCategoryIconClassName, renderCategoryIcon } from "../../lib/category-icons";

type CategoryCardProps = {
  name: string;
  iconKey: string;
  count: number;
  active: boolean;
  onClick: () => void;
};

function formatCount(count: number) {
  return `${count} items`;
}

export function CategoryCard({ name, iconKey, count, active, onClick }: CategoryCardProps) {
  const iconClassName = `category-card__icon ${getCategoryIconClassName(iconKey)}`;

  return (
    <button type="button" className={`category-card${active ? " is-active" : ""}`} aria-pressed={active} onClick={onClick}>
      <div className="category-card__content">
        <div className="category-card__heading">
          <span className={iconClassName}>{renderCategoryIcon(iconKey)}</span>
          <h3>{name}</h3>
        </div>
        <span className="category-card__meta">{formatCount(count)}</span>
      </div>
    </button>
  );
}
