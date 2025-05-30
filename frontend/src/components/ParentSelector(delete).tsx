import React, { useState } from 'react';
import { HerdSelector } from './HerdSelector';
import { FamilySelector } from './FamilySelector'; // You'll create this next

export const HerdFamilyForm = () => {
  const [selectedHerdId, setSelectedHerdId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <HerdSelector selected={selectedHerdId} onChange={setSelectedHerdId} />
      {selectedHerdId && <FamilySelector herdId={selectedHerdId} />}
    </div>
  );
};
