// GitHub Repository Ecosystem - Organized by Category

export interface GitHubRepo {
  name: string;
  url: string;
  description?: string;
}

export interface RepoCategory {
  name: string;
  icon: string;
  repos: GitHubRepo[];
}

export const GITHUB_USERNAME = 'freefilm010';

export const GITHUB_REPOSITORIES: RepoCategory[] = [
  {
    name: 'Core Platforms',
    icon: '🏛️',
    repos: [
      { name: 'aiqtp-omni-nexus', url: 'https://github.com/freefilm010/aiqtp-omni-nexus', description: 'AIQTP Omni Nexus Hub' },
      { name: 'QUANTUM-ASSET-PLATFORM', url: 'https://github.com/freefilm010/QUANTUM-ASSET-PLATFORM', description: 'Quantum Asset Management' },
      { name: 'DYNAMIC-QUANT-ASSET-PLATFORM', url: 'https://github.com/freefilm010/DYNAMIC-QUANT-ASSET-PLATFORM', description: 'Dynamic Quant Assets' },
      { name: 'DYNAMIC-QUANT-PLAT-RENDERROOT-FIXED-', url: 'https://github.com/freefilm010/DYNAMIC-QUANT-PLAT-RENDERROOT-FIXED-', description: 'Render-optimized Platform' },
      { name: 'aiqtp.org', url: 'https://github.com/freefilm010/aiqtp.org', description: 'AIQTP Organization Site' },
      { name: 'aiquanttradeplat', url: 'https://github.com/freefilm010/aiquanttradeplat', description: 'AI Quant Trading Platform' },
      { name: 'aiqtpreprepo', url: 'https://github.com/freefilm010/aiqtpreprepo', description: 'AIQTP Repository' },
    ],
  },
  {
    name: 'AI & Machine Learning',
    icon: '🤖',
    repos: [
      { name: 'AI-EQGC-', url: 'https://github.com/freefilm010/AI-EQGC-', description: 'AI Equity Growth Computing' },
      { name: 'ai-evolution-platform', url: 'https://github.com/freefilm010/ai-evolution-platform', description: 'AI Evolution Platform' },
      { name: 'DeepSeek-V3', url: 'https://github.com/freefilm010/DeepSeek-V3', description: 'DeepSeek V3 LLM' },
      { name: 'DeepSeek-Coder', url: 'https://github.com/freefilm010/DeepSeek-Coder', description: 'DeepSeek Coding Model' },
      { name: 'DeepSeek-Math', url: 'https://github.com/freefilm010/DeepSeek-Math', description: 'DeepSeek Math Model' },
      { name: 'transformers', url: 'https://github.com/freefilm010/transformers', description: 'HuggingFace Transformers' },
      { name: 'ollama', url: 'https://github.com/freefilm010/ollama', description: 'Ollama Local LLMs' },
      { name: 'NeMo', url: 'https://github.com/freefilm010/NeMo', description: 'NVIDIA NeMo Framework' },
      { name: 'SuperAGI', url: 'https://github.com/freefilm010/SuperAGI', description: 'Super AGI Framework' },
      { name: 'langgraph', url: 'https://github.com/freefilm010/langgraph', description: 'LangGraph Agents' },
      { name: 'langchainjs', url: 'https://github.com/freefilm010/langchainjs', description: 'LangChain JavaScript' },
      { name: 'sglang', url: 'https://github.com/freefilm010/sglang', description: 'SGLang Framework' },
      { name: 'DeepSpeed', url: 'https://github.com/freefilm010/DeepSpeed', description: 'Microsoft DeepSpeed' },
      { name: 'self-adaptive-llms', url: 'https://github.com/freefilm010/self-adaptive-llms', description: 'Self-Adaptive LLMs' },
      { name: 'autokeras', url: 'https://github.com/freefilm010/autokeras', description: 'AutoKeras AutoML' },
      { name: 'automl', url: 'https://github.com/freefilm010/automl', description: 'Google AutoML' },
      { name: 'mindsdb', url: 'https://github.com/freefilm010/mindsdb', description: 'MindsDB AI Tables' },
      { name: 'trax', url: 'https://github.com/freefilm010/trax', description: 'Google Trax' },
      { name: 'opencv', url: 'https://github.com/freefilm010/opencv', description: 'OpenCV Vision' },
      { name: 'Awesome-AutoDL', url: 'https://github.com/freefilm010/Awesome-AutoDL', description: 'AutoDL Resources' },
    ],
  },
  {
    name: 'Quantum Computing',
    icon: '⚛️',
    repos: [
      { name: 'Quantum-SDR-RF-AI-LAB', url: 'https://github.com/freefilm010/Quantum-SDR-RF-AI-LAB', description: 'Quantum SDR RF AI Lab' },
      { name: 'QuantumKeep', url: 'https://github.com/freefilm010/QuantumKeep', description: 'Quantum Key Management' },
      { name: 'qiskit-experiments', url: 'https://github.com/freefilm010/qiskit-experiments', description: 'Qiskit Experiments' },
      { name: 'qiskit-nature', url: 'https://github.com/freefilm010/qiskit-nature', description: 'Qiskit Nature' },
      { name: 'qiskit-algorithms', url: 'https://github.com/freefilm010/qiskit-algorithms', description: 'Qiskit Algorithms' },
      { name: 'qiskit-machine-learning', url: 'https://github.com/freefilm010/qiskit-machine-learning', description: 'Qiskit ML' },
      { name: 'qiskit-textbook', url: 'https://github.com/freefilm010/qiskit-textbook', description: 'Qiskit Textbook' },
      { name: 'liboqs', url: 'https://github.com/freefilm010/liboqs', description: 'Open Quantum Safe' },
      { name: 'kyber-k2so', url: 'https://github.com/freefilm010/kyber-k2so', description: 'Kyber Post-Quantum' },
      { name: 'FourQlib', url: 'https://github.com/freefilm010/FourQlib', description: 'FourQ Cryptography' },
    ],
  },
  {
    name: 'Trading & Finance',
    icon: '📈',
    repos: [
      { name: 'ccxt', url: 'https://github.com/freefilm010/ccxt', description: 'CCXT Exchange Library' },
      { name: 'freqtrade', url: 'https://github.com/freefilm010/freqtrade', description: 'Freqtrade Bot' },
      { name: 'freqtrade-strategies', url: 'https://github.com/freefilm010/freqtrade-strategies', description: 'Freqtrade Strategies' },
      { name: 'frequi', url: 'https://github.com/freefilm010/frequi', description: 'Freqtrade UI' },
      { name: 'FinRL', url: 'https://github.com/freefilm010/FinRL', description: 'FinRL Deep RL Trading' },
      { name: 'qlib', url: 'https://github.com/freefilm010/qlib', description: 'Microsoft Qlib' },
      { name: 'QuantMuse', url: 'https://github.com/freefilm010/QuantMuse', description: 'Quant Muse Analytics' },
      { name: 'machine-learning-for-trading', url: 'https://github.com/freefilm010/machine-learning-for-trading', description: 'ML for Trading' },
      { name: 'Machine-Learning-for-Algorithmic-Trading-Bots-with-Python', url: 'https://github.com/freefilm010/Machine-Learning-for-Algorithmic-Trading-Bots-with-Python', description: 'Algo Trading Bots' },
      { name: 'Stock-Prediction-Models', url: 'https://github.com/freefilm010/Stock-Prediction-Models', description: 'Stock Prediction' },
      { name: 'trading-strategy', url: 'https://github.com/freefilm010/trading-strategy', description: 'Trading Strategies' },
      { name: 'strategies', url: 'https://github.com/freefilm010/strategies', description: 'Strategy Library' },
      { name: 'gekko', url: 'https://github.com/freefilm010/gekko', description: 'Gekko Trading Bot' },
      { name: 'Gekko-Strategies', url: 'https://github.com/freefilm010/Gekko-Strategies', description: 'Gekko Strategies' },
      { name: 'crypto-trading-bot', url: 'https://github.com/freefilm010/crypto-trading-bot', description: 'Crypto Trading Bot' },
      { name: 'awesome-crypto-trading-bots', url: 'https://github.com/freefilm010/awesome-crypto-trading-bots', description: 'Awesome Crypto Bots' },
      { name: 'TradingView-API', url: 'https://github.com/freefilm010/TradingView-API', description: 'TradingView API' },
      { name: 'Market-Overview-Indexes-Forex-Metals-Crypto', url: 'https://github.com/freefilm010/Market-Overview-Indexes-Forex-Metals-Crypto', description: 'Market Overview' },
      { name: 'cryptoviz', url: 'https://github.com/freefilm010/cryptoviz', description: 'Crypto Visualization' },
    ],
  },
  {
    name: 'Blockchain & Web3',
    icon: '🔗',
    repos: [
      { name: 'solana', url: 'https://github.com/freefilm010/solana', description: 'Solana Blockchain' },
      { name: 'solana-trading-bot', url: 'https://github.com/freefilm010/solana-trading-bot', description: 'Solana Trading Bot' },
      { name: 'solana-pumpfun-smart-contract', url: 'https://github.com/freefilm010/solana-pumpfun-smart-contract', description: 'Solana PumpFun' },
      { name: 'solana-raydium-sniper-bot', url: 'https://github.com/freefilm010/solana-raydium-sniper-bot', description: 'Raydium Sniper' },
      { name: 'openzeppelin-contracts', url: 'https://github.com/freefilm010/openzeppelin-contracts', description: 'OpenZeppelin Contracts' },
      { name: 'cairo-contracts', url: 'https://github.com/freefilm010/cairo-contracts', description: 'Cairo/StarkNet Contracts' },
      { name: 'EIPs', url: 'https://github.com/freefilm010/EIPs', description: 'Ethereum EIPs' },
      { name: 'exploit-uniswap', url: 'https://github.com/freefilm010/exploit-uniswap', description: 'Uniswap Research' },
      { name: 'nft', url: 'https://github.com/freefilm010/nft', description: 'NFT Contracts' },
      { name: 'token_sale', url: 'https://github.com/freefilm010/token_sale', description: 'Token Sale' },
      { name: 'Tokenicer', url: 'https://github.com/freefilm010/Tokenicer', description: 'Token Tools' },
      { name: 'zbd-docs', url: 'https://github.com/freefilm010/zbd-docs', description: 'ZBD Lightning' },
      { name: 'Substrate', url: 'https://github.com/freefilm010/Substrate', description: 'Polkadot Substrate' },
      { name: 'Telos', url: 'https://github.com/freefilm010/Telos', description: 'Telos Network' },
      { name: 'fabric', url: 'https://github.com/freefilm010/fabric', description: 'Hyperledger Fabric' },
      { name: 'build-blockchain-insurance-app', url: 'https://github.com/freefilm010/build-blockchain-insurance-app', description: 'Blockchain Insurance' },
    ],
  },
  {
    name: 'Research & Development',
    icon: '🔬',
    repos: [
      { name: 'RD-Agent', url: 'https://github.com/freefilm010/RD-Agent', description: 'R&D Agent' },
      { name: 'resdevgent', url: 'https://github.com/freefilm010/resdevgent', description: 'Research Dev Agent' },
      { name: 'mcp-context-forge', url: 'https://github.com/freefilm010/mcp-context-forge', description: 'MCP Context Forge' },
      { name: 'FORALL_DYNAMICS_EXT', url: 'https://github.com/freefilm010/FORALL_DYNAMICS_EXT', description: 'ForAll Dynamics' },
      { name: 'DQuatut', url: 'https://github.com/freefilm010/DQuatut', description: 'DQuant Tutorial' },
      { name: 'qdrant', url: 'https://github.com/freefilm010/qdrant', description: 'Qdrant Vector DB' },
      { name: 'differential-privacy-library', url: 'https://github.com/freefilm010/differential-privacy-library', description: 'Differential Privacy' },
      { name: 'FfDL', url: 'https://github.com/freefilm010/FfDL', description: 'Fabric for Deep Learning' },
      { name: 'zk-circuit-education-module', url: 'https://github.com/freefilm010/zk-circuit-education-module', description: 'ZK Circuits Education' },
      { name: 'ibm.github.io', url: 'https://github.com/freefilm010/ibm.github.io', description: 'IBM GitHub Pages' },
      { name: 'ibmqx-user-guides', url: 'https://github.com/freefilm010/ibmqx-user-guides', description: 'IBM Quantum Guides' },
      { name: 'system-prompts-and-models-of-ai-tools', url: 'https://github.com/freefilm010/system-prompts-and-models-of-ai-tools', description: 'AI System Prompts' },
    ],
  },
  {
    name: 'Tools & Utilities',
    icon: '🛠️',
    repos: [
      { name: 'plex', url: 'https://github.com/freefilm010/plex', description: 'Plex Media' },
      { name: 'freefilm', url: 'https://github.com/freefilm010/freefilm', description: 'FreeFilm Platform' },
      { name: 'xmrig', url: 'https://github.com/freefilm010/xmrig', description: 'XMRig Miner' },
      { name: 'BespokeSynth', url: 'https://github.com/freefilm010/BespokeSynth', description: 'Bespoke Synthesizer' },
    ],
  },
];

export const getAllRepos = (): GitHubRepo[] => {
  return GITHUB_REPOSITORIES.flatMap(cat => cat.repos);
};

export const getReposByCategory = (categoryName: string): GitHubRepo[] => {
  const category = GITHUB_REPOSITORIES.find(cat => cat.name === categoryName);
  return category?.repos || [];
};

export const getTotalRepoCount = (): number => {
  return GITHUB_REPOSITORIES.reduce((sum, cat) => sum + cat.repos.length, 0);
};
