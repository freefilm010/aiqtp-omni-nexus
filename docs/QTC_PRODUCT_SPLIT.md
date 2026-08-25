# QTC Product Split

Status: working product/regulatory architecture. Not legal, tax, accounting, securities, banking, or investment advice.

## Why This Exists

"QTC" has been used to describe several ideas at once:

- a Quantum Time Crystal brand
- a USD-stable payment coin
- a protocol token
- a post-quantum migration wrapper for legacy crypto
- a wallet/security rail
- an ecosystem value-capture instrument

Those ideas cannot all be one legal product. The naming can share a brand family, but the legal, technical, accounting, and compliance tracks must be separated.

## Product A: QTC Payment Stablecoin

Working name: QTC-USD or QTC Pay.

Definition:

- USD-pegged payment stablecoin
- redeemable for $1.00
- backed 1:1 by permitted reserves
- issued only through a licensed or partner-supported structure

Regulatory path:

- GENIUS Act permitted payment stablecoin issuer path, qualified state path, or partner-issuer model
- BSA/AML and OFAC program
- reserve policy
- redemption policy
- monthly attestations
- consumer disclosures
- prohibition on issuer-paid interest/yield to holders

What QTC-USD cannot do:

- promise staking yield
- be backed by "quantum energy" or speculative IP
- commingle reserves with operating funds
- fund DRTRUST operations from customer reserves
- launch before licensing/reserve/redemption structure is ready

## Product B: QTC Protocol Token

Working name: QTC Protocol or QTC Network Token.

Definition:

- non-stable protocol/network token
- may be used for governance, access, protocol fees, standards participation, or migration workflows
- not represented as redeemable for $1.00

Regulatory path:

- securities-law analysis under Howey
- possible Reg D, Reg CF, Reg S, or no-sale/fair-launch strategy
- no public sale until counsel signs off
- no profit, APY, ROI, staking-yield, or "number go up" marketing

What QTC Protocol cannot do:

- be marketed as a stablecoin
- imply guaranteed market value
- imply DRTRUST will buy it back
- use fake liquidity, fake holders, fake market cap, or fake presale status

## Product C: QWallet / Post-Quantum Security Rail

Definition:

- wallet and cryptographic tooling layer
- supports post-quantum migration workflows
- may help users secure legacy assets through new key/signature schemes, wrapped vaults, or migration attestations

Regulatory path:

- software/wallet product first
- custody analysis if DRTRUST ever controls private keys
- money-transmission analysis if value transfer is facilitated
- export-control and cryptography compliance review where applicable

Technical requirements:

- clear custody model: self-custody, assisted custody, or DRTRUST custody
- NIST/FIPS roadmap: ML-KEM, ML-DSA, SLH-DSA where appropriate
- key rotation and recovery policy
- audit log
- no "quantum-proof forever" claims; use "post-quantum-aligned" or "quantum-resistant roadmap"

## Product D: Legacy Crypto Migration Wrapper

Definition:

- optional bridge/wrapper/vault product where legacy crypto holders can move assets into a post-quantum-hardened custody or representation layer

Possible forms:

1. self-custody migration guidance
2. vault wrapper with proof of deposit
3. wrapped token representing deposited legacy crypto
4. institution/enterprise migration service

Regulatory path:

- custody analysis
- money-transmitter analysis
- securities and commodities analysis
- cybersecurity and key-management audit

This is potentially valuable but high-risk. It should come after QWallet MVP and legal review, not before.

## Brand Architecture

```text
QTC Brand Family
  |
  |-- QTC-USD          regulated USD stable/payment coin
  |-- QTC Protocol     non-stable ecosystem/protocol token
  |-- QWallet          wallet/security product
  |-- QTC Migration    legacy-asset post-quantum migration service
```

Each product needs its own page, disclosures, data model, and launch checklist.

## Launch Order

Recommended:

1. QWallet MVP: software demo, no custody, no token sale.
2. Signals Pro subscription: revenue and users.
3. QTC technical whitepaper: split products clearly.
4. EIP / standards proposal: post-quantum wallet/migration standard.
5. Protocol token legal memo.
6. Stablecoin legal memo and partner pathway.
7. Stablecoin issuance only after reserve, licensing, and banking partner are real.

## Forbidden Copy

Do not publish:

- "Federal banking charter pending" unless an application has actually been filed.
- "Guaranteed yield", "staking APY", "risk-free profits", "passive income", or similar claims.
- "Backed by quantum time crystals" as a reserve claim.
- "Presale live" unless offering documentation, exemption, and geofencing are complete.
- fabricated holders, market cap, TVL, users, or liquidity.

## Safe Copy

Use:

- "QTC is a product family under development by DRTRUST."
- "QWallet is exploring post-quantum-aligned key management and asset migration workflows."
- "QTC-USD, if launched, would require reserve, redemption, attestation, AML, and issuer-licensing controls."
- "QTC Protocol, if launched, would require securities-law review before any sale or distribution."

## Bottom Line

QTC can be powerful if it is split correctly. One brand family, multiple legal products, staged launch, no fake certainty.

AIQTP(TM), QTC(TM), QWallet(TM), and related marks are trademarks of DRTRUST (Wyoming).

Copyright (c) DRTRUST (Wyoming). All rights reserved.
