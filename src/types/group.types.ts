export interface CompanyGroup {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  companyCount?: number; // Computed field - number of companies in this group
}

export interface CreateGroupInput {
  groupId: string;
  name: string;
  description?: string;
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
}
