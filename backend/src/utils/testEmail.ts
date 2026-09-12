import dotenv from 'dotenv';
dotenv.config();
import { EmailService } from '../services/emailService';

console.log('\n=== ReCarbo Email Test ===\n');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('Sending test welcome email...\n');

EmailService.sendWelcome(
  process.env.EMAIL_USER!,
  'Dhruvi Raval',
  'ADMIN',
  'ReCarbo Test'
).then(() => {
  console.log('✅ Done — check your inbox at', process.env.EMAIL_USER);
}).catch((err: any) => {
  console.error('❌ Error:', err.message);
});
