import { useEffect, useRef, useState } from "react";
import type { PublishedSnapshot } from "../../types/snapshot";
import { CategoryCard } from "./CategoryCard";

type CategoriesRailProps = {
  categories: PublishedSnapshot["categories"];
  categoryCountById: Record<string, number>;
  activeCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
};

export function CategoriesRail({ categories, categoryCountById, activeCategoryId, onSelectCategory }: CategoriesRailProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ pointerId: number; startX: number; startScrollLeft: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const updateOverflow = () => setHasOverflow(rail.scrollWidth > rail.clientWidth + 1);
    updateOverflow();

    const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(updateOverflow) : null;
    resizeObserver?.observe(rail);
    window.addEventListener("resize", updateOverflow);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateOverflow);
    };
  }, [categories]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    if (!rail || !hasOverflow) return;

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: rail.scrollLeft,
      moved: false,
    };

    rail.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    const dragState = dragStateRef.current;
    if (!rail || !dragState || dragState.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragState.startX;
    if (Math.abs(deltaX) > 6) {
      dragState.moved = true;
      suppressClickRef.current = true;
    }

    rail.scrollLeft = dragState.startScrollLeft - deltaX;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    const dragState = dragStateRef.current;
    if (!rail || !dragState || dragState.pointerId !== event.pointerId) return;

    rail.releasePointerCapture(event.pointerId);
    dragStateRef.current = null;
    setIsDragging(false);
  };

  const handlePointerCancel = () => {
    dragStateRef.current = null;
    setIsDragging(false);
  };

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <section className="section-block" aria-labelledby="popular-categories-title">
      <div className="panel-title" id="popular-categories-title">
        <span className="panel-title__icon" aria-hidden="true">
          ✦
        </span>
        <span>Popular Categories</span>
      </div>
      <p className="section-caption">Drag horizontally or tap a card to focus the lists below.</p>

      <div
        ref={railRef}
        className={`categories-rail${isDragging ? " is-dragging" : ""}`}
        data-overflow={hasOverflow}
        aria-label="Scrollable popular categories"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClickCapture={handleClickCapture}
      >
        <div className="categories-rail__track">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              name={category.name}
              iconKey={category.iconKey}
              count={categoryCountById[category.id] ?? 0}
              active={activeCategoryId === category.id}
              onClick={() => onSelectCategory(activeCategoryId === category.id ? null : category.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
