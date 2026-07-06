const slugs = {
  // --PUBLIC--
  // Login
  login: "/login",
  signup: "/signup",
  logout: "/logout",
  forgotPassword: "/forgot-password",
  // --PROTECTED--
  home: "/",
  //   patient
  patients: "/patient",
  patientCreate: "/patient/create",
  healthCheckHistory: "/patient/:id/healthCheckHistory",
  patientDetail: "/patient/detail/:id",
  // Dental
  dentalRecord: "/dental-record",
  dentalRecordCreate: "/dental-record/create",
  // report
  report1: "/report/1",
  // management
  management: "/management",
  managementUser: "/management-user",
  accountRegistration: "/account-registration",
  loginLogs: "/login-logs",
  // dental articles for guest
  dentalArticles: "/dental-articles",
  // exam campaign
  examCampaign: "/exam-campaign",
  examSchedule: "/exam-campaign/:campaignId/schedule",
};

export { slugs };
