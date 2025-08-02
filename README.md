# 🎯 Faceffle - AI-Powered Group Photo Raffle

**Faceffle** is an intelligent group photo raffle system powered by AI face detection. Upload group photos, automatically detect all faces, and randomly select winners with stunning visual effects!

## ✨ Features

- **🎲 Smart AI Detection**: Automatically detects all faces in group photos using face-api.js
- **📁 Multiple Input Methods**: Upload photos or capture live with your camera
- **🎪 Animated Raffle**: Enjoy a 2-second animated selection process
- **🎨 Visual Results**: Winners are highlighted with special effects and downloadable results
- **🌍 Bilingual Support**: Switch between English and Chinese
- **📱 Responsive Design**: Works perfectly on mobile and desktop devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Modern browser (with WebRTC support for camera features)

### Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Download AI Models**
   ```bash
   npm run download-models
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   Visit http://localhost:3000

### Build & Deploy

```bash
# Build project (automatically downloads models)
npm run build

# Start production server
npm start
```

## 📱 How to Use

1. **Upload or Capture Photo**
   - Click "📁 Upload Photo" to select an existing image
   - Or click "📷 Take Photo" to use your camera

2. **Detect Faces**
   - Click "🔍 Detect Faces" to automatically identify all faces
   - The system marks detected faces with green boxes and numbers

3. **Set Winner Count**
   - Use the number input to set how many winners to select

4. **Start Raffle**
   - Click "🎲 Start Raffle" to begin the animated selection
   - Enjoy the 2-second suspenseful animation!

5. **Download Results**
   - Winners are marked with red boxes and 🎉 celebration icons
   - Click "💾 Download Result" to save the marked photo

## 🛠 Tech Stack

### Frontend Technologies
- **Next.js 15**: React framework with SSR support
- **TypeScript**: Type-safe development experience
- **Tailwind CSS**: Rapid responsive UI development
- **React Hooks**: Modern React state management

### AI & Image Processing
- **face-api.js**: TensorFlow.js-based face detection
- **Canvas API**: Image drawing and processing
- **WebRTC**: Camera access functionality

### Internationalization
- **i18next**: Multi-language support architecture
- **react-i18next**: React i18n integration

## 📁 Project Structure

```
faceffle/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Main layout
│   │   ├── page.tsx            # Main page
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── I18nProvider.tsx    # i18n provider
│   │   └── PhotoLotteryApp.tsx # Main application
│   └── lib/
│       ├── i18n-client.ts      # Multi-language config
│       ├── faceDetection.ts    # Face detection utilities
│       └── lottery.ts          # Raffle logic
├── public/
│   └── models/                 # face-api.js model files
├── scripts/
│   └── download-models.js      # Model download script
└── package.json
```

## 🔧 Customization & Extension

### Adjust Face Detection Accuracy
Modify `TinyFaceDetectorOptions` in `src/lib/faceDetection.ts`:
```typescript
new faceapi.TinyFaceDetectorOptions({
  inputSize: 512,        // Higher accuracy but slower
  scoreThreshold: 0.2    // Adjust detection threshold
})
```

### Customize Raffle Animation
Adjust animation parameters in `src/lib/lottery.ts`:
```typescript
const animationDuration = 2000;  // Animation duration (ms)
const intervalTime = 100;        // Refresh interval (ms)
```

### Add New Languages
Add new languages in `src/lib/i18n-client.ts` resources:
```typescript
ja: {
  translation: {
    title: 'Faceffle',
    subtitle: 'AI搭載グループ写真抽選',
    // ... other translations
  }
}
```

## 🚀 Deployment Options

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Vercel will automatically build and deploy

### Other Platforms
- **Netlify**: Supports Next.js deployments
- **AWS Amplify**: Fully managed deployment
- **Self-hosted**: Use PM2 + Nginx

## 🎨 Brand Identity

**Faceffle** combines "Face" + "Raffle" to create a memorable brand identity:
- 🎯 Target icon represents precision and goal achievement
- Purple-to-pink gradient reflects creativity and excitement
- Playful emoji icons add fun and accessibility

## 🤝 Contributing

We welcome Issues and Pull Requests!

## 📄 License

MIT License

## 📞 Contact

**Project Author**: Roman Chen  
**Development Date**: August 2, 2025  
**Version**: 1.0.0

---

*Made with ❤️ using Next.js, TypeScript, and AI*