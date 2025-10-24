# 🎰 Orange Casino

**A comprehensive web-based casino simulation featuring multiple games, achievements, and an immersive gambling experience.**

Orange Casino is a fully-featured casino demo built with vanilla HTML, CSS, and JavaScript. Experience the thrill of casino gaming without any real money involved - perfect for entertainment and educational purposes.

## 🎮 Games & Features

### Casino Games
- **🎰 Slot Machines** - Classic 3-reel slots with orange-themed jackpots
- **🃏 Blackjack** - Strategic card game against the dealer (hit, stand, bust mechanics)
- **♠️ Texas Hold'em Poker** - Community card poker with betting rounds
- **🎫 Scratch-Offs** - 6 different ticket types ($1-$20) with realistic odds and winning patterns

### Interactive Features
- **🏆 Achievement System** - Track milestones and earn bonus rewards
- **💰 Financial Management** - Balance tracking, debt system, and "emergency" cash options
- **📹 Video Tutorial** - Comprehensive guide covering all games (6 chapters, 30 seconds each)
- **🎯 Todd the Casino Host** - Interactive character providing tips and encouragement

### Additional Content
- **⛏️ Coal Mine Mini-Game** - Alternative earning mechanism
- **🏥 Medical Services** - Humorous "organ selling" for emergency cash
- **📊 Statistics Tracking** - Detailed win/loss records and playing history

## 🚀 Getting Started

### Quick Start
1. Open `index.html` in your web browser
2. Start with $1000 virtual money
3. Navigate between games using the top menu
4. Watch the help video for game tutorials

### Local Development
For optimal performance, run a local server:

**PowerShell:**
```powershell
python -m http.server 8000
```

**Node.js:**
```bash
npx serve .
```

Then visit `http://localhost:8000`

## 🎨 Customization

### Theming
Edit CSS variables in `style.css`:
```css
:root {
    --primary-orange: #ff6b35;
    --secondary-orange: #ff8c42;
    --accent-gold: #ffd700;
}
```

### Adding Games
1. Create new HTML file based on existing game templates
2. Add corresponding JavaScript in `scripts/` directory
3. Update navigation in all HTML files
4. Add achievement triggers if desired

## 📁 Project Structure

```
OrangeCasino/
├── index.html          # Homepage and main navigation
├── slot.html           # Slot machine game
├── blackjack.html      # Blackjack game
├── poker.html          # Texas Hold'em poker
├── scratch-offs.html   # Scratch-off tickets
├── achievements.html   # Achievement tracking
├── help-video.html     # Tutorial video player
├── coal-mine.html      # Mining mini-game
├── surgery.html        # Medical services (humor)
├── style.css           # Global styles and theming
├── scripts/
│   ├── app.js          # Core utilities and balance management
│   ├── slot.clean.js   # Slot machine logic
│   ├── blackjack.clean.js # Blackjack game engine
│   ├── poker.clean.js  # Poker game mechanics
│   ├── achievements.js # Achievement system
│   ├── surgery.js      # Medical services logic
│   └── todd-dialogue.js # Interactive host character
└── images/             # Game assets and graphics
```

## 🎯 Key Features

- **Persistent Progress** - LocalStorage saves balance, debt, and achievements
- **Realistic Odds** - Each game uses authentic casino mathematics
- **Mobile Responsive** - Optimized for desktop and mobile devices
- **No Real Money** - 100% simulation for safe entertainment
- **Educational Value** - Learn casino games without financial risk

## 🏆 Achievement Examples

- **High Roller**: Bet $100 in a single slots spin
- **Blackjack Master**: Win 10 consecutive hands
- **Lucky Scratcher**: Win big on scratch-off tickets
- **Debt Collector**: Accumulate significant virtual debt
- **Organ Donor**: Use emergency cash services

## ⚠️ Disclaimer

**This is a simulation only.** No real money is involved. Orange Casino is designed for entertainment and educational purposes. Please gamble responsibly in real-world scenarios.

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Storage**: LocalStorage for persistence
- **Media**: YouTube API integration for tutorials
- **Design**: CSS Grid, Flexbox, CSS animations
- **Responsive**: Mobile-first design principles

---

*Made with ❤️ for entertainment and education. No real money involved.*
