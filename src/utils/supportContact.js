export const SUPPORT_EMAIL = (
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPPORT_EMAIL) ||
  'avatawebsite@gmail.com'
).trim();

export const buildGmailComposeUrl = ({ to = SUPPORT_EMAIL, subject = '', body = '' } = {}) => {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to,
    su: subject,
    body
  });

  return `https://mail.google.com/mail/?${params.toString()}`;
};

export const SUPPORT_GMAIL_COMPOSE = buildGmailComposeUrl();