// src/utils/colorUtils.ts

import L from "leaflet";

/**
 * Generate a distinct color using golden angle (for even hue distribution).
 */
export function getColor(index: number): string {
  const goldenAngle = 137.508;
  const hue = index * goldenAngle;
  return `hsl(${hue % 360}, 65%, 55%)`;
}

/**
 * Generate a map of items to distinct colors.
 */
export function generateColorMap<T extends { value: string | number }>(
  items: T[]
): Record<string, string> {
  const colorMap: Record<string, string> = {};
  items.forEach((item, index) => {
    colorMap[item.value.toString()] = getColor(index);
  });
  return colorMap;
}

/**
 * Create a Leaflet divIcon with a colored circle or marker.
 */
export function createColoredIcon(family_id: number, index: number): L.DivIcon {
  const color = getColor(family_id);

  return L.divIcon({
    className: "custom-colored-icon",
    html: `
      <div style="
        background-color: ${color};
      color: white;
      font-weight: bold;
      font-size: 12px;
      line-height: 16px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid white;
      text-align: center;
      box-shadow: 0 0 2px rgba(0,0,0,0.5);
      user-select:none;
      ">
            ${index}

      </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}
