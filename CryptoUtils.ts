import crypto from 'crypto';


const algorithm = 'aes-256-cbc';
const iv = crypto.randomBytes(16);

// Function to generate a key from a string
const getKeyFromPassword = (password: string) => {
  return crypto.createHash('sha256').update(password).digest('base64').substr(0, 32);
};

// Function to encrypt text
export const encrypt = (text: string, password: string) => {
  const key = getKeyFromPassword(password);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'utf8'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

// Function to decrypt text
export const decrypt = (encryptedText: string, password: string) => {
  const key = getKeyFromPassword(password);
  const textParts = encryptedText.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encrypted = textParts.join(':');
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'utf8'), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};