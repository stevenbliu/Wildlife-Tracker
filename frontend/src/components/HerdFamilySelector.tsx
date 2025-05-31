import React from 'react';

type Herd = {
    id: number;
    species_name: string;
};

type Family = {
    id: number;
    friendly_name: string;
    herd_id: string;
};

type HerdFamilySelectorProps = {
    herds: Herd[];
    families: Family[];
    selectedHerd: Herd | null;
    selectedFamily: Family | null;
    onHerdSelect: (herd: Herd | null) => void;
    onFamilySelect: (family: Family | null) => void;
};

export const HerdFamilySelector: React.FC<HerdFamilySelectorProps> = ({
    herds,
    families,
    selectedHerd,
    selectedFamily,
    onHerdSelect,
    onFamilySelect,
}) => {
    return (
        <div className="herd-family-selector">
            {/* Herd Dropdown */}
            <label>
                Herd:
                <select
                    value={selectedHerd?.id || ''}
                    onChange={e => {
                        const herd_id = Number(e.target.value);
                        const herd = herds.find(h => h.id === herd_id) || null;
                        onHerdSelect(herd);

                    }}
                >
                    <option value="">-- Select Herd --</option>
                    {herds.map(herd => (
                        <option key={herd.id} value={herd.id}>
                            {herd.species_name}
                        </option>
                    ))}
                </select>
            </label>

            {/* Family Dropdown */}
            <label>
                Family:

                <select
                    value={selectedFamily?.id || ''}
                    onChange={e => {
                        const familyId = Number(e.target.value);
                        const family = families.find(f => f.id === familyId) || null;
                        onFamilySelect(family);
                    }}
                >
                    <option value="">-- Select Family --</option>
                    {families.map(family => (
                        <option key={family.id} value={family.id}>
                            {family.friendly_name}
                        </option>
                    ))}
                </select>
            </label>
        </div>
    );
};
