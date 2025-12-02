import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Company } from '@/types/company.types';
import { getCompanyAvatarColor } from '@/lib/utils';

interface CompanySwitcherProps {
  companies: Company[];
  currentCompanyId?: string;
  onCompanySwitch: (companyId: string) => void;
}

export const CompanySwitcher: React.FC<CompanySwitcherProps> = ({
  companies,
  currentCompanyId,
  onCompanySwitch,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentCompany = companies.find(c => c.id === currentCompanyId);
  const showSearch = companies.length >= 5;

  // Filter companies based on search query
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (companyId: string) => {
    if (companyId !== currentCompanyId) {
      onCompanySwitch(companyId);
    }
    setOpen(false);
    setSearchQuery('');
  };

  // Get initials from company name
  const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length === 1) {
      return name.substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors"
          aria-label="Switch company"
        >
          {currentCompany ? (
            <>
              <div className="text-sm font-medium text-foreground">{currentCompany.name}</div>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
            </>
          ) : (
            <>
              <div className="text-sm font-medium text-foreground">Select Company</div>
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[300px]" align="start">
        {showSearch && (
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
        )}
        <div className="max-h-[300px] overflow-y-auto p-1">
          {filteredCompanies.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No companies found
            </div>
          ) : (
            filteredCompanies.map((company) => (
              <DropdownMenuItem
                key={company.id}
                onClick={() => handleSelect(company.id)}
                className="flex items-center gap-3 p-2 cursor-pointer"
              >
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                  style={{ backgroundColor: getCompanyAvatarColor(company.id) }}
                >
                  {getInitials(company.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {company.name}
                  </div>
                  {company.subscription && (
                    <div className="text-xs text-muted-foreground">
                      {company.subscription.tier}
                    </div>
                  )}
                </div>
                {company.id === currentCompanyId && (
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
