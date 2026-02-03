export type ImportSuccessResponse = {
  status: number;
  message: string;
  data: {
    buildingsCreated: number;
    roomsCreated: number;
    tenantsCreated: number;
  };
};

export type ImportErrorDetail = {
  sheet: "Buildings" | "Rooms" | "Tenants" | string;
  row: number;
  field?: string;
  message: string;
};

export type ImportErrorResponse = {
  status: number;
  message: string;
  data: {
    errors: ImportErrorDetail[];
  };
};
