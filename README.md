# mafia-party

A Mafia Party Mini App built with Next.js, World ID authentication, and on-chain game mechanics.

## Features

- **World ID Authentication**: Secure player verification using World ID
- **Lobby System**: Create and join game lobbies
- **Role-Based Gameplay**: Mafia, Detective, Doctor, and Villager roles
- **Night/Day Phases**: Strategic gameplay with timed phases
- **On-Chain Proofs**: Verifiable game outcomes using smart contracts
- **Bot Support**: AI players to fill lobbies
- **Real-time Chat**: In-game communication system

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy environment file: `cp .env.example .env.local`
4. Configure your environment variables
5. Run development server: `npm run dev`
6. Set up ngrok: `ngrok http 3000`
7. Update your Mini App configuration in the World Developer Portal

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS, Mini Apps UI Kit
- **Authentication**: World ID, NextAuth.js
- **Blockchain**: Foundry, viem, World Chain
- **Database**: Supabase (planned)
- **Deployment**: Vercel/ngrok for development

## Game Rules

### Objective
Mafia must eliminate all villagers, while villagers must identify and eliminate all mafia members.

### Roles
- **Mafia**: Kill one player each night
- **Detective**: Investigate one player's alignment each night
- **Doctor**: Protect one player from mafia attacks each night
- **Villager**: Vote during the day to eliminate suspected mafia

### Phases
1. **Night Phase**: Special roles perform actions
2. **Day Phase**: Discussion and voting to eliminate a player
3. **Repeat** until one side wins

## Development

### Smart Contracts
Located in `/contracts` directory. Built with Foundry.

```bash
cd contracts
forge test
forge script script/DeployMafiaContracts.s.sol --rpc-url worldchain_sepolia
```

### Frontend
Located in `/src` directory. Built with Next.js.

```bash
npm run dev
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License
