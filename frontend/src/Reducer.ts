export type Herd = {
  id: number;
  species_name: string;
};

export type Family = {
  id: number;
  friendly_name: string;
  herd_id: number;
};

export type Item = {
  type: "herd" | "family";
  id: number;
  name: string;
  active: boolean;
  herd_id?: number; // Added herd_id for family items
};

export type State = {
  herds: Herd[];
  families: Family[];
  filteredFamilies: Family[];
  selectedHerd: Herd | null;
  selectedFamily: Family | null;
  selectedItems: Item[];
};

export type Action =
  | { type: "SET_HERDS"; payload: Herd[] }
  | { type: "SET_FAMILIES"; payload: Family[] }
  | { type: "SELECT_HERD"; payload: Herd | null }
  | { type: "SELECT_FAMILY"; payload: Family | null }
  | { type: "TOGGLE_ITEM"; payload: number }
  | { type: "REMOVE_ITEM"; payload: number }
  | { type: "CLEAR_ALL_ITEMS" }
  | { type: "SET_SELECTED_ITEMS"; payload: Item[] };  // New action

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_HERDS":
      return { ...state, herds: action.payload };

    case "SET_FAMILIES":
      return {
        ...state,
        families: action.payload,
        filteredFamilies: action.payload,
      };

    case "SELECT_HERD": {
      const selectedHerd = action.payload;

      const filteredFamilies = selectedHerd
        ? state.families.filter((fam) => fam.herd_id === selectedHerd.id)
        : state.families;

      let selectedFamily = state.selectedFamily;

      if (
        selectedFamily &&
        selectedHerd &&
        selectedFamily.herd_id !== selectedHerd.id
      ) {
        selectedFamily = null;
      }

      // selectedItems are NOT cleared or filtered when changing herd selection
      // So just keep as is, but ensure herd item is added if needed

      const selectedItems = [...state.selectedItems];

      if (
        selectedHerd &&
        !selectedItems.some(
          (item) => item.type === "herd" && item.id === selectedHerd.id
        )
      ) {
        selectedItems.push({
          type: "herd",
          id: selectedHerd.id,
          name: selectedHerd.species_name,
          active: true,
        });
      }

      return {
        ...state,
        selectedHerd,
        filteredFamilies,
        selectedFamily,
        selectedItems,
      };
    }

    case "SELECT_FAMILY": {
      const selectedFamily = action.payload;
      let selectedHerd = state.selectedHerd;

      if (selectedFamily && !selectedHerd) {
        selectedHerd =
          state.herds.find((h) => h.id === selectedFamily.herd_id) || null;
      }

      const filteredFamilies = selectedHerd
        ? state.families.filter((fam) => fam.herd_id === selectedHerd.id)
        : state.families;

      const selectedItems = [...state.selectedItems];

      if (
        selectedHerd &&
        !selectedItems.some(
          (item) => item.type === "herd" && item.id === selectedHerd.id
        )
      ) {
        selectedItems.push({
          type: "herd",
          id: selectedHerd.id,
          name: selectedHerd.species_name,
          active: true,
        });
      }

      if (
        selectedFamily &&
        !selectedItems.some(
          (item) => item.type === "family" && item.id === selectedFamily.id
        )
      ) {
        selectedItems.push({
          type: "family",
          id: selectedFamily.id,
          name: selectedFamily.friendly_name,
          active: true,
          herd_id: selectedFamily.herd_id, // <--- Important
        });
      }

      return {
        ...state,
        selectedHerd,
        selectedFamily,
        filteredFamilies,
        selectedItems,
      };
    }

    case "TOGGLE_ITEM": {
      const selectedItems = state.selectedItems.map((item) =>
        item.id === action.payload ? { ...item, active: !item.active } : item
      );
      return { ...state, selectedItems };
    }

    case "REMOVE_ITEM": {
      return {
        ...state,
        selectedItems: state.selectedItems.filter(
          (item) => item.id !== action.payload
        ),
      };
    }

    case "CLEAR_ALL_ITEMS": {
      return {
        ...state,
        selectedItems: [],
      };
    }

    case "SET_SELECTED_ITEMS": {
      return {
        ...state,
        selectedItems: action.payload,
      };
    }

    default:
      return state;
  }
}
