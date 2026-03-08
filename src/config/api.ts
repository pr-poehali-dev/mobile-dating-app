export const API_ENDPOINTS = {
  dashboardApi: 'https://functions.poehali.dev/08b68f40-ac3c-482d-a3e6-2162d9ca149b',
  statsApi: 'https://functions.poehali.dev/d0eab1c3-6c38-45d7-bbb4-71f9163a691f',
  notificationsApi: 'https://functions.poehali.dev/3e531873-80bf-4d1f-bf41-1900d639b186',
  approvalsApi: 'https://functions.poehali.dev/28de9a43-6aa7-491b-a20e-7a2e9ecebe49',
  savingsApi: 'https://functions.poehali.dev/97e7934f-259b-404b-9eae-6de53448c8c2',
  ticketsApi: 'https://functions.poehali.dev/36ca4c35-8625-4e62-b383-d5feac4de266',
  dictionariesApi: 'https://functions.poehali.dev/b3ad2f9d-7ef7-471b-a7fc-2ff1e0855ff8',
  authApi: 'https://functions.poehali.dev/cc3b9628-07ec-420e-b340-1c20cad986da',
  paymentsApi: 'https://functions.poehali.dev/7f682e02-1640-40e7-8e2a-7a4e7723b309',
  categoriesApi: 'https://functions.poehali.dev/57770127-fe63-43db-9fb1-87a2bbe27010',
  usersApi: 'https://functions.poehali.dev/e779e7ac-e5aa-4f88-b2dc-e856132ad15d',
  invoiceOcr: 'https://functions.poehali.dev/b41527a2-cf8d-4623-8504-e8717507b9d0',
  monitoring: 'https://functions.poehali.dev/ffd10ecc-7940-4a9a-92f7-e6eea426304d',
  pushNotifications: 'https://functions.poehali.dev/cc67e884-8946-4bcd-939d-ea3c195a6598',
  clearAllData: 'https://functions.poehali.dev/69d0e8e7-3feb-4d34-9a63-64521e899118',
  collectLogs: 'https://functions.poehali.dev/acbb6915-96bf-4e7f-ab66-c34c3fa4b26c',
  logAnalyzer: 'https://functions.poehali.dev/dd221a88-cc33-4a30-a59f-830b0a41862f',
  main: 'https://functions.poehali.dev/8f2170d4-9167-4354-85a1-4478c2403dfd',
} as const;

export const getApiUrl = (endpoint: string, baseApi: keyof typeof API_ENDPOINTS = 'dictionariesApi'): string => {
  return `${API_ENDPOINTS[baseApi]}?endpoint=${endpoint}`;
};