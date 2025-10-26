# Medical Search AI

An AI-powered medical information search engine that translates layman's terms into medical terminology and searches trusted medical databases.

## Features

- **AI-Powered Translation**: Converts everyday language into medical terms using LLM APIs
- **Multiple LLM Support**: Works with Anthropic Claude, OpenAI GPT, or Google Gemini
- **Fallback Mode**: Works even without API keys using basic keyword matching
- **Medical Database Search**: Searches PubMed and MedlinePlus automatically
- **Clean UI**: Modern, responsive interface with dark mode support
- **Free APIs**: All medical databases are completely free to use

## How It Works

1. User enters symptoms or conditions in plain language (e.g., "bad headache with light sensitivity")
2. AI translates to medical terms (e.g., "migraine, photophobia, cephalgia")
3. System searches medical databases using these terms
4. Results are displayed with sources and links

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **LLM APIs**: Anthropic Claude / OpenAI / Google Gemini (optional)
- **Medical APIs**: PubMed (NCBI E-utilities), MedlinePlus Connect

## Getting Started

### Prerequisites

- Node.js 18+ installed
- (Optional) API key from one of these providers:
  - [Anthropic Claude](https://console.anthropic.com/) - $5 free credit
  - [OpenAI](https://platform.openai.com/) - $5 free credit
  - [Google Gemini](https://ai.google.dev/) - Free tier available

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd medical-search-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.local.example .env.local
   ```

4. **Add your API key** (choose ONE):

   Edit `.env.local` and add your API key:
   ```env
   # Option 1: Anthropic (recommended)
   ANTHROPIC_API_KEY=your_key_here

   # Option 2: OpenAI
   # OPENAI_API_KEY=your_key_here

   # Option 3: Google Gemini
   # GOOGLE_API_KEY=your_key_here
   ```

   **Note**: If no API key is provided, the app will use a fallback keyword matching system (less accurate but functional).

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. Enter your symptoms or medical question in plain language
2. Click "Search" or press Enter
3. View the AI translation of your query
4. Browse results from PubMed and MedlinePlus
5. Click "Read more" to visit the original source

### Example Queries

- "I have a really bad headache with light sensitivity and nausea"
- "My heart races when I stand up quickly"
- "Painful swelling in my joints, especially in the morning"
- "Chronic stomach pain after eating fatty foods"
- "Difficulty breathing when exercising"

## API Usage & Costs

### LLM APIs (Choose One)

All three options offer free trials:

- **Anthropic Claude**: $5 free credit (~2,500 queries)
- **OpenAI GPT-3.5**: $5 free credit (~10,000 queries)
- **Google Gemini**: Free tier with rate limits

### Medical APIs (Always Free)

- **PubMed**: Unlimited, no API key required
- **MedlinePlus**: Unlimited, no API key required

## Building for Production

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy!

### Other Platforms

Works on any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Render
- Self-hosted

## Project Structure

```
medical-search-ai/
├── app/
│   ├── api/
│   │   ├── translate/     # LLM translation endpoint
│   │   │   └── route.ts
│   │   └── search/        # Medical database search
│   │       └── route.ts
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main search interface
│   └── globals.css        # Global styles
├── .env.local.example     # Environment template
├── next.config.ts         # Next.js config
├── tailwind.config.ts     # Tailwind config
└── tsconfig.json          # TypeScript config
```

## Extending the Project

### Adding More Medical Databases

Edit `app/api/search/route.ts` to add more sources:

- OpenFDA: Drug information and adverse events
- ClinicalTrials.gov: Clinical trial data
- CDC: Disease information
- WHO: Global health data

### Improving AI Translation

Modify the prompts in `app/api/translate/route.ts` to:
- Add specialty focus (cardiology, neurology, etc.)
- Include symptom severity assessment
- Generate differential diagnoses

### Adding Features

Ideas for enhancement:
- Save search history
- Export results as PDF
- Symptom checker wizard
- Drug interaction checker
- Multi-language support

## Limitations & Disclaimer

**⚠️ IMPORTANT**: This tool is for **informational purposes only**.

- Not a substitute for professional medical advice
- Always consult qualified healthcare providers
- Do not use for emergency medical situations
- Results may not be comprehensive or up-to-date

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.

## Support

If you encounter issues:
1. Check that your API key is correctly set in `.env.local`
2. Ensure you're using Node.js 18 or higher
3. Try clearing `.next` folder and rebuilding
4. Check the console for error messages

## Acknowledgments

- PubMed/NCBI for medical literature access
- MedlinePlus for health information
- Anthropic, OpenAI, and Google for LLM APIs
- Next.js team for the excellent framework
