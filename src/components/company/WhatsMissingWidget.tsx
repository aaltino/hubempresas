import React from 'react';

interface WhatsMissingWidgetProps {
  companyId: string;
}

const WhatsMissingWidget: React.FC<WhatsMissingWidgetProps> = ({ companyId }) => {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-lg font-semibold text-blue-800">O que está faltando</h3>
      <p className="text-blue-600">Analisando dados da empresa...</p>
    </div>
  );
};

export default WhatsMissingWidget;