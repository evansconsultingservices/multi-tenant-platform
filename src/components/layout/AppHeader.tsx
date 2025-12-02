import React from 'react';
import { CompanySwitcher } from './CompanySwitcher';
import { Company } from '@/types/company.types';

interface AppHeaderProps {
  companies: Company[];
  currentCompanyId?: string;
  onCompanySwitch: (companyId: string) => void;
  isLoading?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  companies,
  currentCompanyId,
  onCompanySwitch,
  isLoading = false,
}) => {
  return (
    <header className="h-[60px] border-b bg-background flex items-center px-6 gap-6">
      {/* Branding */}
      <div className="flex items-center gap-3">
        <img
          src="/orch-icon.png"
          alt="Media Orchestrator"
          className="h-8 w-8"
        />
        <span className="text-lg font-semibold text-foreground">
          Media Orchestrator
        </span>
      </div>

      {/* Company Switcher */}
      <div className="flex-1">
        {!isLoading && companies.length > 0 && (
          <CompanySwitcher
            companies={companies}
            currentCompanyId={currentCompanyId}
            onCompanySwitch={onCompanySwitch}
          />
        )}
      </div>
    </header>
  );
};
