import fs from 'fs';
import crypto from 'crypto';

// Secure environment setup script
class SecureEnvManager {
    constructor() {
        this.envPath = '.env';
        this.examplePath = '.env.example';
    }

    // Generate secure random keys
    generateSecureKey(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    generateEncryptionKey() {
        return crypto.randomBytes(32).toString('base64');
    }

    // Create .env file with secure defaults
    createSecureEnv() {
        console.log('🔐 Kreiranje sigurnog .env fajla...');

        const envContent = `# Supabase Configuration
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=

# AI Services (dodajte vaše ključeve)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
DEEPSEEK_API_KEY=
GEMINI_API_KEY=

# Storage (Wasabi S3)
WASABI_ACCESS_KEY=
WASABI_SECRET_KEY=
WASABI_BUCKET=
WASABI_REGION=
WASABI_ENDPOINT=

# Email Services
SENDGRID_API_KEY=
RESEND_API_KEY=

# Application (automatski generisano)
NODE_ENV=development
PORT=5000
SECRET_KEY=${this.generateSecureKey()}
SECRETS_ENCRYPTION_KEY=${this.generateEncryptionKey()}

# Payment (Stripe)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
`;

        fs.writeFileSync(this.envPath, envContent);
        console.log('✅ .env fajl kreiran sa sigurnim ključevima');
        console.log('📝 Molim vas da popunite nedostajuće vrednosti u .env fajlu');
    }

    // Check if .env exists
    checkEnvExists() {
        return fs.existsSync(this.envPath);
    }

    // Add .env to .gitignore if not already there
    updateGitignore() {
        const gitignorePath = '.gitignore';
        let gitignoreContent = '';

        if (fs.existsSync(gitignorePath)) {
            gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        }

        if (!gitignoreContent.includes('.env')) {
            gitignoreContent += '\n# Environment variables\n.env\n.env.local\n.env.*.local\n';
            fs.writeFileSync(gitignorePath, gitignoreContent);
            console.log('✅ .env dodato u .gitignore za sigurnost');
        }
    }

    // Main setup function
    setup() {
        console.log('🚀 Pokretanje sigurnog setup-a environment varijabli...\n');

        if (this.checkEnvExists()) {
            console.log('⚠️  .env fajl već postoji');
            console.log('💡 Ako želite da ga regenerišete, obrišite postojeći .env fajl\n');
            return;
        }

        this.createSecureEnv();
        this.updateGitignore();

        console.log('\n📋 SLEDEĆI KORACI:');
        console.log('1. Otvorite .env fajl');
        console.log('2. Popunite Supabase credentials');
        console.log('3. Dodajte AI API ključeve');
        console.log('4. Konfigurisite Wasabi storage');
        console.log('5. Pokrenite: npm run dev\n');

        console.log('🔒 SIGURNOST:');
        console.log('- .env fajl je automatski dodat u .gitignore');
        console.log('- Nikad ne commitujte .env fajl u git');
        console.log('- Koristite .env.example za dokumentaciju\n');
    }
}

// Run setup
const envManager = new SecureEnvManager();
envManager.setup();
