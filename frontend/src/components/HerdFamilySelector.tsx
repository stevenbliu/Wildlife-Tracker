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
                        // console.log('Selected herd:', selectedHerd);
                        console.log('Herds:', herds);

                        // console.log('Selected herd ID:', e.target.value);   
                        const herd_id = Number(e.target.value);
                        console.log('Selected herd ID:', herd_id);
                        const herd = herds.find(h => h.id === herd_id) || null;
                        console.log('herd_id:', herd_id);
                        console.log('Matched herd:', herd);
                        onHerdSelect(herd);
                        console.log('Selected herd:', herd);

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
                        console.log('Selected family:', selectedFamily);
                        const familyId = Number(e.target.value);
                        console.log('Selected family ID:', familyId);
                        const family = families.find(f => f.id === familyId) || null;
                        console.log('Found family:', family);
                        console.log('Families:', families);
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
