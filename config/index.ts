const config = {
  JWT_AUTH: {
    JWT_SECRET: process.env.JWT_SECRET || 'propskit',
  },
  GOOGLE_AUTH_CREDENTIALS: {
    GOOGLE_CLIENT_ID: '502003814897-o805irlcjob5uo5tv479l0j57s6rfhun.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: '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',
    GOOGLE_CALLBACK_URL: 'http://localhost:4000/auth/google/callback',
  },
  FACEBOOK_AUTH_CREDENTIALS: {
    FACEBOOK_CLIENT_ID: '971321040256904',
    FACEBOOK_CLIENT_SECRET: 'a2f0b1f868d72871b333db2babed8689',
    FACEBOOK_CALLBACK_URL: 'http://localhost:4000/auth/facebook/callback',
  },
  STRIPE: {
    STRIPE_SECRET:
      process.env.STRIPE_SECRET ||
      'sk_test_51KRdC1KpFBLEF6kGhfNqfLKNsE3Ij8HwoHg0mqwsdwkYkaaTILf1R4ff0EhhYBwyrdPGEtFFuWlBCQJstGYYdoZ600o7hSDPiS',
    SIGNING_SECRET: process.env.STRIPE_SIGNING_SECRET || 'whsec_BEfpvUVnLJ2Hq0ssdscoTGWefZEb4nU7',
  },
  AWS: {
    EMAIL_NOTIFICATIONS_SQS_URL:
      process.env.EMAIL_NOTIFICATIONS_SQS_URL ||
      'https://sqs.us-east-2.amazonaws.com/481703043626/propskit-notify-user',
  },
  MIXPANEL_TOKEN: process.env.MIXPANEL_TOKEN || '44a761d870b36b208f877ac6744e80ed',
};

export default config;
