import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  FileCode,
  Rocket,
  Shield,
  Copy,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  BookOpen
} from "lucide-react";
import { ALL_STANDARDS, VALUE_NATURE_LABELS } from "@/lib/standards/protocolRegistry";

const CONTRACT_TEMPLATES = [
  { 
    id: 'erc20', 
    name: 'ERC-20', 
    description: 'Fungible token — like currency, similar in value',
    chain: 'Ethereum',
    features: ['Fungible', 'Transferable', 'Divisible'],
    standardIds: ['erc-20', 'erc-2612', 'oz-erc20', 'oz-security'],
    valueNature: 'like_and_similar' as const,
  },
  { 
    id: 'erc721', 
    name: 'ERC-721', 
    description: 'Non-fungible — unique, NOT similar in value',
    chain: 'Ethereum',
    features: ['Single Mint', 'Metadata URI', 'Royalties'],
    standardIds: ['erc-721', 'eip-2981', 'oz-erc721', 'oz-security'],
    valueNature: 'like_but_not_similar' as const,
  },
  { 
    id: 'erc721a', 
    name: 'ERC-721A', 
    description: 'Gas-optimized unique tokens, batch mint',
    chain: 'Ethereum',
    features: ['Batch Mint', 'Gas Savings', 'Royalties'],
    standardIds: ['erc-721a', 'erc-721', 'eip-2981', 'oz-erc721', 'oz-security'],
    valueNature: 'like_but_not_similar' as const,
  },
  { 
    id: 'erc1155', 
    name: 'ERC-1155', 
    description: 'Multi-token — editions & mixed assets',
    chain: 'Ethereum',
    features: ['Semi-Fungible', 'Batch Transfer', 'Multi-Token'],
    standardIds: ['erc-1155', 'eip-2981', 'oz-erc1155', 'oz-security'],
    valueNature: 'hybrid' as const,
  },
  { 
    id: 'erc1400', 
    name: 'ERC-1400', 
    description: 'Security token — regulated, compliance-ready',
    chain: 'Ethereum',
    features: ['KYC/AML', 'Partitions', 'Forced Transfer'],
    standardIds: ['erc-1400', 'erc-3643', 'oz-access-control', 'oz-security'],
    valueNature: 'regulatory' as const,
  },
  { 
    id: 'erc5192', 
    name: 'ERC-5192', 
    description: 'Soulbound — non-transferable credentials',
    chain: 'Ethereum',
    features: ['Non-Transferable', 'Identity', 'Credentials'],
    standardIds: ['erc-5192', 'erc-721'],
    valueNature: 'like_but_not_similar' as const,
  },
];

const ContractBuilder = () => {
  const [template, setTemplate] = useState('erc721a');
  const [contractName, setContractName] = useState('MyNFTCollection');
  const [symbol, setSymbol] = useState('MNFT');
  const [maxSupply, setMaxSupply] = useState('10000');
  const [mintPrice, setMintPrice] = useState('0.05');
  const [maxPerWallet, setMaxPerWallet] = useState('5');
  const [royalties, setRoyalties] = useState('5');
  const [hasWhitelist, setHasWhitelist] = useState(true);
  const [hasReveal, setHasReveal] = useState(true);
  const [deployedContracts, setDeployedContracts] = useState<any[]>([]);

  const selectedTemplate = CONTRACT_TEMPLATES.find(t => t.id === template);

  const generateCode = () => {
    return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract ${contractName} is ERC721A, Ownable, ReentrancyGuard {
    uint256 public constant MAX_SUPPLY = ${maxSupply};
    uint256 public constant MINT_PRICE = ${mintPrice} ether;
    uint256 public constant MAX_PER_WALLET = ${maxPerWallet};

    string private baseTokenURI;
    ${hasReveal ? 'string private hiddenMetadataURI;' : ''}
    ${hasReveal ? 'bool public revealed = false;' : ''}
    ${hasWhitelist ? 'bytes32 public merkleRoot;' : ''}
    ${hasWhitelist ? 'bool public whitelistMintEnabled = false;' : ''}
    bool public publicMintEnabled = false;

    constructor() ERC721A("${contractName}", "${symbol}") {}

    function mint(uint256 quantity) external payable nonReentrant {
        require(publicMintEnabled, "Public mint not active");
        require(totalSupply() + quantity <= MAX_SUPPLY, "Max supply exceeded");
        require(msg.value >= MINT_PRICE * quantity, "Insufficient payment");
        require(_numberMinted(msg.sender) + quantity <= MAX_PER_WALLET, "Max per wallet exceeded");
        
        _safeMint(msg.sender, quantity);
    }

    ${hasWhitelist ? `
    function whitelistMint(uint256 quantity, bytes32[] calldata proof) external payable nonReentrant {
        require(whitelistMintEnabled, "Whitelist mint not active");
        require(MerkleProof.verify(proof, merkleRoot, keccak256(abi.encodePacked(msg.sender))), "Invalid proof");
        require(totalSupply() + quantity <= MAX_SUPPLY, "Max supply exceeded");
        
        _safeMint(msg.sender, quantity);
    }` : ''}

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        ${hasReveal ? 'if (!revealed) return hiddenMetadataURI;' : ''}
        return string(abi.encodePacked(baseTokenURI, _toString(tokenId), ".json"));
    }

    // Owner functions
    function setBaseURI(string calldata uri) external onlyOwner {
        baseTokenURI = uri;
    }

    ${hasReveal ? `
    function reveal() external onlyOwner {
        revealed = true;
    }` : ''}

    function withdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }

    // Royalties (EIP-2981)
    function royaltyInfo(uint256, uint256 salePrice) external view returns (address, uint256) {
        return (owner(), (salePrice * ${royalties}) / 100);
    }
}`;
  };

  const deploy = () => {
    toast.success("Contract deployment initiated", {
      description: "Please confirm the transaction in your wallet"
    });
    setDeployedContracts([
      ...deployedContracts,
      {
        name: contractName,
        address: '0x' + Math.random().toString(16).slice(2, 42),
        chain: selectedTemplate?.chain,
        template: template,
        deployedAt: new Date()
      }
    ]);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generateCode());
    toast.success("Contract code copied!");
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Builder */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Smart Contract Builder
          </CardTitle>
          <CardDescription>Create and deploy NFT smart contracts without coding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection */}
          <div className="grid grid-cols-4 gap-4">
            {CONTRACT_TEMPLATES.map((t) => (
              <div
                key={t.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  template === t.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                }`}
                onClick={() => setTemplate(t.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={template === t.id ? 'default' : 'outline'}>{t.name}</Badge>
                  <Badge variant="secondary" className="text-xs">{t.chain}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
            ))}
          </div>

          {/* Contract Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Contract Name</Label>
              <Input
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
                placeholder="MyNFTCollection"
              />
            </div>
            <div>
              <Label>Symbol</Label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="MNFT"
              />
            </div>
            <div>
              <Label>Max Supply</Label>
              <Input
                type="number"
                value={maxSupply}
                onChange={(e) => setMaxSupply(e.target.value)}
              />
            </div>
            <div>
              <Label>Mint Price (ETH)</Label>
              <Input
                type="number"
                value={mintPrice}
                onChange={(e) => setMintPrice(e.target.value)}
                step="0.01"
              />
            </div>
            <div>
              <Label>Max Per Wallet</Label>
              <Input
                type="number"
                value={maxPerWallet}
                onChange={(e) => setMaxPerWallet(e.target.value)}
              />
            </div>
            <div>
              <Label>Royalties (%)</Label>
              <Input
                type="number"
                value={royalties}
                onChange={(e) => setRoyalties(e.target.value)}
                min="0"
                max="25"
              />
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <Label>Features</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">Whitelist Mint</p>
                  <p className="text-xs text-muted-foreground">Merkle tree verification</p>
                </div>
                <Switch checked={hasWhitelist} onCheckedChange={setHasWhitelist} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">Delayed Reveal</p>
                  <p className="text-xs text-muted-foreground">Hide metadata until reveal</p>
                </div>
                <Switch checked={hasReveal} onCheckedChange={setHasReveal} />
              </div>
            </div>
          </div>

          {/* Code Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Generated Contract</Label>
              <Button variant="outline" size="sm" onClick={copyCode}>
                <Copy className="h-4 w-4 mr-1" />
                Copy Code
              </Button>
            </div>
            <ScrollArea className="h-[300px] rounded-lg border bg-muted/50">
              <pre className="p-4 text-xs">
                <code>{generateCode()}</code>
              </pre>
            </ScrollArea>
          </div>

          <Button className="w-full" size="lg" onClick={deploy}>
            <Rocket className="h-4 w-4 mr-2" />
            Deploy Contract
          </Button>
        </CardContent>
      </Card>

      {/* Sidebar */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Selected Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTemplate && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold">{selectedTemplate.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1">Value Classification</p>
                  <Badge variant="outline" className="text-xs">
                    {VALUE_NATURE_LABELS[selectedTemplate.valueNature]?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Features</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedTemplate.features.map((f, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{f}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Applicable Standards Disclosure */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Applicable Standards
            </CardTitle>
            <CardDescription className="text-xs">
              Standards this contract must conform to
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTemplate && (
              <div className="space-y-2">
                {selectedTemplate.standardIds.map((sid) => {
                  const std = ALL_STANDARDS.find(s => s.id === sid);
                  if (!std) return null;
                  return (
                    <div key={sid} className="p-2 rounded border bg-muted/30 space-y-1">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-primary" />
                        <span className="text-xs font-semibold">{std.name.split(':')[0]}</span>
                        {std.requiredForCompliance && (
                          <Badge variant="destructive" className="text-[9px] h-4">REQ</Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-snug">
                        {std.description.slice(0, 120)}…
                      </p>
                    </div>
                  );
                })}
                {/* Always show security standards */}
                <div className="pt-2 border-t mt-2">
                  <p className="text-[10px] text-muted-foreground mb-1 font-medium">Security Layer</p>
                  {['fips-203', 'fips-204'].map((sid) => {
                    const std = ALL_STANDARDS.find(s => s.id === sid);
                    if (!std) return null;
                    return (
                      <div key={sid} className="flex items-center gap-1 py-0.5">
                        <Shield className="h-3 w-3 text-primary" />
                        <span className="text-[10px]">{std.name.split(':')[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Deployed Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            {deployedContracts.length === 0 ? (
              <div className="py-8 text-center">
                <FileCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-sm">No contracts deployed yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deployedContracts.map((contract, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{contract.name}</span>
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Deployed
                      </Badge>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      {contract.address}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="secondary" className="text-xs">{contract.chain}</Badge>
                      <Button variant="ghost" size="sm" className="h-6 text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContractBuilder;
