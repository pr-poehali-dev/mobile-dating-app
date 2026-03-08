export interface ServiceTemplate {
  id: string;
  name: string;
  icon: string;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'password';
    placeholder: string;
    secret_name: string;
  }[];
  api_endpoint: string;
  default_warning: number;
  default_critical: number;
}

export const SERVICE_TEMPLATES: ServiceTemplate[] = [
  {
    id: 'timeweb-cloud',
    name: 'Timeweb Cloud',
    icon: 'Cloud',
    api_endpoint: 'https://api.timeweb.cloud/api/v1/account/finances',
    default_warning: 500,
    default_critical: 100,
    fields: [
      {
        name: 'api_token',
        label: 'API токен',
        type: 'password',
        placeholder: 'Введите API токен из личного кабинета',
        secret_name: 'TIMEWEB_API_TOKEN',
      },
    ],
  },
  {
    id: 'timeweb-hosting',
    name: 'Timeweb Hosting',
    icon: 'Server',
    api_endpoint: 'https://api.timeweb.ru/v1.1/finances/accounts',
    default_warning: 500,
    default_critical: 100,
    fields: [
      {
        name: 'api_token',
        label: 'API токен',
        type: 'password',
        placeholder: 'Введите API токен',
        secret_name: 'TIMEWEB_HOSTING_API_TOKEN',
      },
    ],
  },
  {
    id: 'smsru',
    name: 'sms.ru',
    icon: 'MessageSquare',
    api_endpoint: 'https://sms.ru/my/balance',
    default_warning: 100,
    default_critical: 20,
    fields: [
      {
        name: 'api_id',
        label: 'API ID',
        type: 'password',
        placeholder: 'Введите API ID',
        secret_name: 'SMSRU_API_ID',
      },
    ],
  },
  {
    id: 'mango',
    name: 'Mango Office',
    icon: 'Phone',
    api_endpoint: 'https://app.mango-office.ru/vpbx/account/balance',
    default_warning: 1000,
    default_critical: 200,
    fields: [
      {
        name: 'api_key',
        label: 'API ключ',
        type: 'password',
        placeholder: 'Введите API ключ',
        secret_name: 'MANGO_OFFICE_API_KEY',
      },
      {
        name: 'api_salt',
        label: 'API Salt',
        type: 'password',
        placeholder: 'Введите API Salt',
        secret_name: 'MANGO_OFFICE_API_SALT',
      },
    ],
  },
  {
    id: 'plusofon',
    name: 'Plusofon',
    icon: 'PhoneCall',
    api_endpoint: 'https://restapi.plusofon.ru/api/v1/payment/balance',
    default_warning: 500,
    default_critical: 100,
    fields: [
      {
        name: 'api_token',
        label: 'API токен',
        type: 'password',
        placeholder: 'Введите API токен',
        secret_name: 'PLUSOFON_API_TOKEN',
      },
    ],
  },
  {
    id: 'regru',
    name: 'Reg.ru',
    icon: 'Globe',
    api_endpoint: 'https://api.reg.ru/api/regru2/user/get_balance',
    default_warning: 100,
    default_critical: 20,
    fields: [
      {
        name: 'username',
        label: 'Логин',
        type: 'text',
        placeholder: 'Введите логин от API',
        secret_name: 'REGRU_USERNAME',
      },
      {
        name: 'password',
        label: 'Пароль',
        type: 'password',
        placeholder: 'Введите пароль от API',
        secret_name: 'REGRU_PASSWORD',
      },
    ],
  },
  {
    id: '1dedic',
    name: '1Dedic (BILLmanager)',
    icon: 'Server',
    api_endpoint: 'https://my.1dedic.ru/billmgr',
    default_warning: 1000,
    default_critical: 200,
    fields: [
      {
        name: 'username',
        label: 'Логин',
        type: 'text',
        placeholder: 'Введите логин от личного кабинета',
        secret_name: 'DEDIC_USERNAME',
      },
      {
        name: 'password',
        label: 'Пароль',
        type: 'password',
        placeholder: 'Введите пароль от личного кабинета',
        secret_name: 'DEDIC_PASSWORD',
      },
    ],
  },
  {
    id: 'smsfast',
    name: 'SmsFast',
    icon: 'MessageSquare',
    api_endpoint: 'https://smsfastapi.com/stubs/handler_api.php',
    default_warning: 100,
    default_critical: 20,
    fields: [
      {
        name: 'api_key',
        label: 'API ключ',
        type: 'password',
        placeholder: 'Введите API ключ из настроек аккаунта',
        secret_name: 'SMSFAST_API_KEY',
      },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: 'Sparkles',
    api_endpoint: 'https://api.openai.com/v1/dashboard/billing/credit_grants',
    default_warning: 5,
    default_critical: 1,
    fields: [
      {
        name: 'api_key',
        label: 'API ключ',
        type: 'password',
        placeholder: 'Введите API ключ (sk-...)',
        secret_name: 'OPENAI_API_KEY',
      },
    ],
  },
];
