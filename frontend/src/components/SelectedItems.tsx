import React from "react";
import { Item } from "../Reducer";

type SelectedItemsProps = {
  selectedItems: Item[];
  onToggleHerd: (herdId: number) => void;
  onToggleFamily: (familyId: number) => void;
  onRemoveItem: (item: Item) => void;
  onClearAll: () => void;
};

export const SelectedItems: React.FC<SelectedItemsProps> = ({
  selectedItems,
  onToggleHerd,
  onToggleFamily,
  onRemoveItem,
  onClearAll,
}) => {
  // Group items by herd id
  const grouped = selectedItems.reduce<Record<number, { herd: Item; families: Item[] }>>(
    (acc, item) => {
      if (item.type === "herd") {
        acc[item.id] = acc[item.id] || { herd: item, families: [] };
      } else if (item.type === "family") {
        const herdId = item.herd_id ?? -1;
        if (!acc[herdId]) {
          acc[herdId] = {
            herd: { type: "herd", id: herdId, name: "Unknown Herd", active: true },
            families: [],
          };
        }
        acc[herdId].families.push(item);
      }
      return acc;
    },
    {}
  );

  return (
    <aside className="selected-items-panel">
      <div>
        <button onClick={onClearAll}>Clear All</button>
      </div>
      <ul>
        {Object.values(grouped).map(({ herd, families }) => (
          <li key={`herd-${herd.id}`}>
            <label>
              <input
                type="checkbox"
                checked={herd.active}
                onChange={() => onToggleHerd(herd.id)}
              />
              {herd.name}
            </label>
            <button onClick={() => onRemoveItem(herd)}>x</button>
            <ul style={{ paddingLeft: "20px" }}>
              {families.map((fam) => (
                <li key={`family-${fam.id}`}>
                  <label>
                    <input
                      type="checkbox"
                      checked={fam.active}
                      onChange={() => onToggleFamily(fam.id)}
                    />
                    {fam.name}
                  </label>
                  <button onClick={() => onRemoveItem(fam)}>x</button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </aside>
  );
};
