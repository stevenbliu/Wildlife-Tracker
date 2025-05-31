// Helper functions for reducer cases

function setHerds(state: State, payload: Herd[]): State {
  return { ...state, herds: payload };
}

function setFamilies(state: State, payload: Family[]): State {
  return { ...state, families: payload, filteredFamilies: payload };
}

function selectHerd(state: State, selectedHerd: Herd | null): State {
  // Filter families to selected herd or all if none
  const filteredFamilies = selectedHerd
    ? state.families.filter((fam) => fam.herd_id === selectedHerd.id)
    : state.families;

  // Clear selected family if it doesn't belong to selected herd
  let selectedFamily = state.selectedFamily;
  if (
    selectedFamily &&
    selectedHerd &&
    selectedFamily.herd_id !== selectedHerd.id
  ) {
    selectedFamily = null;
  }

  // Filter selectedItems to only the selected herd and its families
  let selectedItems = state.selectedItems.filter((item) =>
    item.type === "herd"
      ? selectedHerd && item.id === selectedHerd.id
      : item.type === "family"
      ? selectedHerd && item.herd_id === selectedHerd.id
      : false
  );

  // Add selected herd if missing
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

  // Add all families of herd if missing
  if (selectedHerd) {
    const herdFamilies = state.families.filter(
      (f) => f.herd_id === selectedHerd.id
    );
    herdFamilies.forEach((fam) => {
      if (
        !selectedItems.some(
          (item) => item.type === "family" && item.id === fam.id
        )
      ) {
        selectedItems.push({
          type: "family",
          id: fam.id,
          name: fam.friendly_name,
          active: true,
          herd_id: fam.herd_id,
        });
      }
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

function selectFamily(state: State, selectedFamily: Family | null): State {
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
      herd_id: selectedFamily.herd_id,
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

function toggleItem(
  state: State,
  payload: { id: number; type: "herd" | "family" }
): State {
  const { id, type } = payload;
  const toggledItem = state.selectedItems.find(
    (item) => item.id === id && item.type === type
  );
  if (!toggledItem) return state;

  if (type === "herd") {
    const newActive = !toggledItem.active;
    const updatedItems = state.selectedItems.map((item) =>
      item.type === "herd" && item.id === id
        ? { ...item, active: newActive }
        : item.type === "family" && item.herd_id === id
        ? { ...item, active: newActive }
        : { ...item }
    );

    return { ...state, selectedItems: updatedItems };
  }

  if (type === "family") {
    const updatedItems = state.selectedItems.map((item) =>
      item.id === id && item.type === type
        ? { ...item, active: !item.active }
        : { ...item }
    );

    const herdId = toggledItem.herd_id;
    if (herdId === undefined) {
      console.error("Family item missing herd_id:", toggledItem);
      return { ...state, selectedItems: updatedItems };
    }

    const anyFamilyActive = updatedItems.some(
      (item) => item.type === "family" && item.herd_id === herdId && item.active
    );

    const finalItems = updatedItems.map((item) =>
      item.type === "herd" && item.id === herdId
        ? { ...item, active: anyFamilyActive }
        : item
    );

    return { ...state, selectedItems: finalItems };
  }

  return state;
}

function removeItem(state: State, idToRemove: number): State {
  const itemToRemove = state.selectedItems.find(
    (item) => item.id === idToRemove
  );
  if (!itemToRemove) return state;

  if (itemToRemove.type === "herd") {
    const filteredItems = state.selectedItems.filter(
      (item) =>
        item.id !== idToRemove &&
        !(item.type === "family" && item.herd_id === idToRemove)
    );

    return {
      ...state,
      selectedItems: filteredItems,
      selectedHerd:
        state.selectedHerd?.id === idToRemove ? null : state.selectedHerd,
      selectedFamily:
        state.selectedFamily?.herd_id === idToRemove
          ? null
          : state.selectedFamily,
      filteredFamilies: state.families,
    };
  }

  if (itemToRemove.type === "family") {
    const filteredItems = state.selectedItems.filter(
      (item) => item.id !== idToRemove
    );

    const herdId = itemToRemove.herd_id;
    const anyFamilyActive = filteredItems.some(
      (item) => item.type === "family" && item.herd_id === herdId && item.active
    );

    const finalItems = filteredItems.map((item) =>
      item.type === "herd" && item.id === herdId
        ? { ...item, active: anyFamilyActive }
        : item
    );

    const selectedFamily =
      state.selectedFamily?.id === itemToRemove.id
        ? null
        : state.selectedFamily;

    return { ...state, selectedItems: finalItems, selectedFamily };
  }

  return state;
}

function clearAllItems(state: State): State {
  return {
    ...state,
    selectedItems: [],
    selectedHerd: null,
    selectedFamily: null,
    filteredFamilies: state.families,
  };
}

function setSelectedItems(state: State, payload: Item[]): State {
  console.log;
  const validItems = payload.filter((item) => {
    if (item.type === "family") {
      return (
        item.herd_id !== undefined &&
        state.herds.some((h) => h.id === item.herd_id)
      );
    }
    if (item.type === "herd") {
      return state.herds.some((h) => h.id === item.id);
    }
    return false;
  });

  const uniqueItems = validItems.reduce<Item[]>((acc, curr) => {
    if (!acc.some((item) => item.id === curr.id && item.type === curr.type)) {
      acc.push(curr);
    }
    return acc;
  }, []);

  return { ...state, selectedItems: uniqueItems };
}

// Main reducer
export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_HERDS":
      return setHerds(state, action.payload);
    case "SET_FAMILIES":
      return setFamilies(state, action.payload);
    case "SELECT_HERD":
      return selectHerd(state, action.payload);
    case "SELECT_FAMILY":
      return selectFamily(state, action.payload);
    case "TOGGLE_ITEM":
      return toggleItem(state, action.payload);
    case "REMOVE_ITEM":
      return removeItem(state, action.payload);
    case "CLEAR_ALL_ITEMS":
      return clearAllItems(state);
    case "SET_SELECTED_ITEMS":
      return setSelectedItems(state, action.payload);
    case "UPDATE_FILTERED_FAMILIES":
      return { ...state, filteredFamilies: action.payload };
    default:
      return state;
  }
}
