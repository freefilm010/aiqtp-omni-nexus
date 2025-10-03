# AIQTP System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Landing   │  │   Trading    │  │   Lightning      │   │
│  │    Page     │  │  Dashboard   │  │     Vault        │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              Supabase (Lovable Cloud)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │    Auth     │  │  PostgreSQL  │  │  Edge Functions  │   │
│  │   System    │  │   Database   │  │   (Serverless)   │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
│  ┌─────────────┐  ┌──────────────┐                          │
│  │   Storage   │  │   Realtime   │                          │
│  │   Buckets   │  │  Subscriptions│                         │
│  └─────────────┘  └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              External Services & APIs                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Market    │  │  Lightning   │  │   AI/ML         │   │
│  │   Data API  │  │   Network    │  │   Services      │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Component Structure
```
src/
├── components/
│   ├── ui/                    # Reusable UI components (Shadcn)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── Header.tsx            # Navigation header
│   ├── Hero.tsx              # Landing page hero
│   ├── Features.tsx          # Features section
│   ├── Security.tsx          # Security section
│   ├── Footer.tsx            # Footer
│   └── MarketplaceCategories.tsx
├── pages/
│   ├── Index.tsx             # Landing page
│   ├── TradingDashboard.tsx  # Trading interface
│   ├── LightningVault.tsx    # Lightning wallet
│   └── NotFound.tsx          # 404 page
├── lib/
│   └── utils.ts              # Utility functions
├── hooks/                     # Custom React hooks
│   ├── use-mobile.tsx
│   └── use-toast.ts
└── App.tsx                    # Root component
```

### State Management
- **React Query** for server state
- **React Context** for global UI state
- **Local State** for component-specific state

### Routing
```typescript
/ (Index)                     → Landing page
/trading                      → Trading dashboard
/vault                        → Lightning vault
/* (NotFound)                 → 404 page
```

## Backend Architecture (Supabase)

### Database Schema

#### Core Tables
```sql
1. profiles              # Extended user data
2. portfolio             # User holdings
3. trades                # Trade history
4. watchlist             # User watchlist
5. lightning_channels    # Lightning Network channels
6. lightning_transactions # Lightning payments
7. ai_signals            # Trading signals
8. notifications         # User notifications
```

#### Relationships
```
auth.users (Supabase Auth)
    ↓ (1:1)
profiles
    ↓ (1:many)
├── portfolio
├── trades
├── watchlist
├── lightning_channels
└── lightning_transactions
```

### Row Level Security (RLS)
All tables implement RLS policies:
- Users can only access their own data
- Public read for certain profile fields
- Admin role for system operations

### Edge Functions

#### 1. market-data
```typescript
Purpose: Fetch real-time market data
Trigger: HTTP request, scheduled cron
Input: { symbols: string[] }
Output: { prices, changes, volume }
External APIs: CoinGecko, Binance
```

#### 2. execute-trade
```typescript
Purpose: Process trading orders
Trigger: HTTP request
Input: { symbol, type, amount, price }
Output: { trade_id, status, execution }
Security: Auth required, balance check
```

#### 3. lightning-payment
```typescript
Purpose: Lightning Network transactions
Trigger: HTTP request
Input: { type, amount, recipient }
Output: { payment_hash, status }
Integration: Lightning Network SDK
```

#### 4. ai-signals
```typescript
Purpose: Generate AI trading signals
Trigger: Scheduled cron (every 15min)
Input: Market data
Output: { signals, confidence, reasoning }
AI Service: OpenAI / Custom model
```

#### 5. portfolio-analytics
```typescript
Purpose: Calculate portfolio metrics
Trigger: HTTP request, real-time
Input: { user_id }
Output: { value, returns, allocation }
```

## Data Flow

### Trading Flow
```
1. User clicks "Buy" button
   ↓
2. Frontend validates input
   ↓
3. Call execute-trade Edge Function
   ↓
4. Edge Function:
   - Verifies user balance
   - Calls market data API
   - Creates trade record
   - Updates portfolio
   ↓
5. Real-time subscription updates UI
   ↓
6. Confirmation shown to user
```

### Lightning Payment Flow
```
1. User initiates Lightning payment
   ↓
2. Frontend generates payment request
   ↓
3. Call lightning-payment Edge Function
   ↓
4. Edge Function:
   - Connects to Lightning node
   - Creates payment invoice/request
   - Monitors payment status
   ↓
5. Real-time updates show status
   ↓
6. Confirmation + receipt
```

### AI Signal Generation
```
1. Scheduled cron triggers ai-signals
   ↓
2. Edge Function:
   - Fetches latest market data
   - Analyzes with AI model
   - Generates signals
   - Stores in database
   ↓
3. Real-time subscription notifies users
   ↓
4. Signals appear in dashboard
```

## Security Architecture

### Authentication Layers
1. **Supabase Auth** - JWT tokens
2. **Row Level Security** - Database policies
3. **Edge Function Auth** - Verify JWT on each call
4. **API Rate Limiting** - Prevent abuse

### Data Protection
- Passwords: bcrypt hashing
- API Keys: Encrypted in Supabase Vault
- Sensitive data: Encrypted at rest
- HTTPS: All traffic encrypted in transit

### Wallet Security
- Private keys: Never stored on server
- Signing: Client-side only
- Multi-sig: Optional for high-value
- Cold storage: Integration for large amounts

## Performance Optimization

### Frontend
- Code splitting by route
- Lazy loading components
- Image optimization
- Bundle size optimization
- CDN for static assets

### Backend
- Database indexing
- Query optimization
- Caching strategy (Redis potential)
- Connection pooling
- Edge function cold start optimization

### Real-time
- WebSocket connection pooling
- Subscription batching
- Selective data streaming
- Debounced updates

## Scalability Considerations

### Horizontal Scaling
- Stateless edge functions
- Database read replicas
- CDN for global distribution
- Load balancing

### Vertical Scaling
- Database performance tuning
- Query optimization
- Caching layers
- Background job processing

## Monitoring & Observability

### Metrics to Track
- API response times
- Edge function execution time
- Database query performance
- Error rates
- User activity
- Trade volume

### Logging Strategy
- Frontend: Console errors to logging service
- Backend: Structured logging in edge functions
- Database: Query logs for slow queries
- Security: Authentication attempts, failures

## Deployment Architecture

```
Development → Lovable Preview
     ↓
Testing/Staging → Lovable Staging URL
     ↓
Production → Custom Domain (lovable.app or custom)
```

### CI/CD Pipeline
1. Code changes pushed to GitHub
2. Auto-sync to Lovable
3. Preview build generated
4. Manual testing
5. Deploy to production
6. Post-deployment monitoring

## Future Architecture Enhancements

### Microservices (if needed at scale)
- Separate services for trading, Lightning, AI
- Message queue for async processing
- Event-driven architecture

### Mobile Apps
- React Native for iOS/Android
- Shared business logic
- Native performance optimizations

### API for Third-Party Developers
- Public API endpoints
- API key management
- Rate limiting per key
- Documentation portal
