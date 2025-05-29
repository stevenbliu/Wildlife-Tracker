import React, { useEffect, useState } from 'react';
import { fetchHerds } from '../api/wildlifeApi';

type Props = {
  onSelect: (herdId: string) => void;
};

export default function HerdSelector({ onSelect }: Props) {
  const [herds, setHerds] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchHerds().then(setHerds);
  }, []);

  return (
    <select onChange={e => onSelect(e.target.value)} defaultValue="">
      <option value="" disabled>
        Select a Herd
      </option>
      {herds.map(herd => (
        <option key={herd.id} value={herd.id}>
          {herd.name}
        </option>
      ))}
    </select>
  );
}
