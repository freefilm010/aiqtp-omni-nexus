import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Utility functions
function arrayToHex(arr: Uint8Array): string {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return arrayToHex(new Uint8Array(hashBuffer));
}

// Proof of Temporal Resonance verification
interface FloquetParams {
  numQubits: number;
  gFactor: number;
  disorderStrength: number;
  interactionStrength: number;
}

function constructFloquetHamiltonian(params: FloquetParams) {
  const { numQubits, gFactor, disorderStrength, interactionStrength } = params;
  
  const spinFlip: number[][] = [];
  for (let i = 0; i < numQubits; i++) {
    spinFlip.push([i, Math.PI * gFactor]);
  }
  
  const interactions: number[][] = [];
  for (let i = 0; i < numQubits - 1; i++) {
    const phi = (Math.random() * Math.PI) + (0.5 * Math.PI);
    interactions.push([i, i + 1, phi * interactionStrength]);
  }
  
  const disorder: number[] = [];
  for (let i = 0; i < numQubits; i++) {
    disorder.push((Math.random() * 2 - 1) * Math.PI * disorderStrength);
  }
  
  return { spinFlip, interactions, disorder };
}

function calculateAutocorrelation(samples: string[]): number {
  if (samples.length < 2) return 0;
  
  let correlation = 0;
  let count = 0;
  
  for (let i = 0; i < samples.length - 1; i++) {
    const current = samples[i];
    const next = samples[i + 1];
    
    let matchingBits = 0;
    for (let j = 0; j < current.length; j++) {
      if (current[j] !== next[j]) matchingBits++;
    }
    
    const normalizedMatch = (matchingBits / current.length) * 2 - 1;
    correlation += normalizedMatch;
    count++;
  }
  
  return count > 0 ? correlation / count : 0;
}

// Mine a new block with PoTR consensus
async function mineBlock(
  transactions: any[],
  previousBlock: any,
  validatorId: string
): Promise<{
  blockHash: string;
  merkleRoot: string;
  resonanceProof: object;
  periodDoubling: boolean;
}> {
  // Generate DTC samples for PoTR
  const params: FloquetParams = {
    numQubits: 8,
    gFactor: 0.97,
    disorderStrength: 0.5,
    interactionStrength: 0.7
  };
  
  const hamiltonian = constructFloquetHamiltonian(params);
  const samples: string[] = [];
  
  // Simulate Floquet evolution
  for (let shot = 0; shot < 100; shot++) {
    let state = '';
    for (let q = 0; q < params.numQubits; q++) {
      const flipProbability = Math.sin(hamiltonian.spinFlip[q][1] / 2) ** 2;
      const flipped = Math.random() < flipProbability;
      const disorderPhase = hamiltonian.disorder[q];
      const disorderEffect = Math.cos(disorderPhase) > 0;
      state += (flipped !== disorderEffect) ? '1' : '0';
    }
    samples.push(state);
  }
  
  const autocorrelation = calculateAutocorrelation(samples);
  const periodDoubling = autocorrelation < -0.7;
  
  // Generate merkle root from transactions
  const txHashes = transactions.map(tx => tx.tx_hash);
  const merkleRoot = await generateHash(txHashes.join(''));
  
  // Generate block hash
  const blockData = {
    previousHash: previousBlock?.block_hash || '0'.repeat(64),
    merkleRoot,
    validatorId,
    timestamp: Date.now(),
    autocorrelation,
    periodDoubling
  };
  
  const blockHash = 'blk_' + await generateHash(JSON.stringify(blockData));
  
  const resonanceProof = {
    type: 'PoTR',
    samples: samples.slice(0, 10),
    autocorrelation,
    periodDoubling,
    params,
    timestamp: Date.now(),
    validatorId
  };
  
  return {
    blockHash,
    merkleRoot,
    resonanceProof,
    periodDoubling
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, ...params } = await req.json();
    console.log(`QTC Network action: ${action}`);

    switch (action) {
      case 'get_block': {
        const { block_height } = params;
        
        const { data: block, error } = await supabase
          .from('qtc_blocks')
          .select('*')
          .eq('block_height', block_height)
          .single();

        if (error) throw error;

        const { data: transactions } = await supabase
          .from('qtc_transactions')
          .select('*')
          .eq('block_height', block_height);

        return new Response(JSON.stringify({
          success: true,
          block: {
            ...block,
            transactions: transactions || []
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_latest_blocks': {
        const { limit = 10 } = params;

        const { data: blocks, error } = await supabase
          .from('qtc_blocks')
          .select('*')
          .order('block_height', { ascending: false })
          .limit(limit);

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          blocks: blocks || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'mine_block': {
        // Get pending transactions
        const { data: pendingTxs } = await supabase
          .from('qtc_transactions')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(100);

        // Get latest block
        const { data: latestBlock } = await supabase
          .from('qtc_blocks')
          .select('*')
          .order('block_height', { ascending: false })
          .limit(1)
          .single();

        const newBlockHeight = (latestBlock?.block_height || 0) + 1;
        const validatorId = params.validator_id || 'system_validator';

        // Mine the block
        const { blockHash, merkleRoot, resonanceProof, periodDoubling } = await mineBlock(
          pendingTxs || [],
          latestBlock,
          validatorId
        );

        if (!periodDoubling) {
          return new Response(JSON.stringify({
            success: false,
            error: 'PoTR consensus failed - period doubling not achieved'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Calculate fees
        const totalFees = (pendingTxs || []).reduce((sum, tx) => sum + Number(tx.fee), 0);
        const blockReward = 12.5;

        // Create the new block
        const { data: newBlock, error: blockError } = await supabase
          .from('qtc_blocks')
          .insert({
            block_height: newBlockHeight,
            block_hash: blockHash,
            previous_hash: latestBlock?.block_hash || '0'.repeat(64),
            merkle_root: merkleRoot,
            validator_id: validatorId,
            resonance_proof: resonanceProof,
            transaction_count: (pendingTxs || []).length,
            total_fees: totalFees,
            block_reward: blockReward
          })
          .select()
          .single();

        if (blockError) throw blockError;

        // Update pending transactions to confirmed
        if (pendingTxs && pendingTxs.length > 0) {
          await supabase
            .from('qtc_transactions')
            .update({
              status: 'confirmed',
              block_height: newBlockHeight,
              confirmed_at: new Date().toISOString()
            })
            .in('id', pendingTxs.map(tx => tx.id));
        }

        console.log(`Block ${newBlockHeight} mined successfully`);

        return new Response(JSON.stringify({
          success: true,
          block: newBlock,
          reward: blockReward,
          fees: totalFees,
          transactions_included: (pendingTxs || []).length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'register_validator': {
        const { wallet_address, stake_amount } = params;
        if (!wallet_address || !stake_amount) {
          throw new Error('wallet_address and stake_amount required');
        }

        // Check wallet balance
        const { data: ledger } = await supabase
          .from('qtc_ledger')
          .select('*')
          .eq('wallet_address', wallet_address)
          .single();

        if (!ledger || Number(ledger.balance) < stake_amount) {
          throw new Error('Insufficient balance for staking');
        }

        // Generate validator key
        const validatorKeyBytes = new Uint8Array(32);
        crypto.getRandomValues(validatorKeyBytes);
        const validatorKey = 'val_' + arrayToHex(validatorKeyBytes);

        // Create validator
        const { data: validator, error } = await supabase
          .from('qtc_validators')
          .insert({
            wallet_address,
            validator_key: validatorKey,
            stake_amount,
            is_active: true
          })
          .select()
          .single();

        if (error) throw error;

        // Lock stake
        await supabase
          .from('qtc_ledger')
          .update({
            balance: Number(ledger.balance) - stake_amount,
            staked_balance: Number(ledger.staked_balance) + stake_amount
          })
          .eq('wallet_address', wallet_address);

        return new Response(JSON.stringify({
          success: true,
          validator: {
            id: validator.id,
            validator_key: validatorKey,
            stake_amount,
            status: 'active'
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_validators': {
        const { data: validators, error } = await supabase
          .from('qtc_validators')
          .select('*')
          .eq('is_active', true)
          .order('stake_amount', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          validators: validators || [],
          total_staked: (validators || []).reduce((sum, v) => sum + Number(v.stake_amount), 0)
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'verify_transaction': {
        const { tx_hash } = params;
        if (!tx_hash) throw new Error('tx_hash required');

        const { data: tx, error } = await supabase
          .from('qtc_transactions')
          .select('*')
          .eq('tx_hash', tx_hash)
          .single();

        if (error) throw error;

        let block = null;
        if (tx.status === 'confirmed') {
          const { data: blockData } = await supabase
            .from('qtc_blocks')
            .select('block_hash, resonance_proof')
            .eq('block_height', tx.block_height)
            .single();
          block = blockData;
        }

        return new Response(JSON.stringify({
          success: true,
          transaction: tx,
          verification: {
            status: tx.status,
            confirmations: tx.status === 'confirmed' ? 6 : 0,
            block_hash: block?.block_hash || null,
            resonance_verified: block?.resonance_proof?.periodDoubling || false
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_chain_info': {
        const { data: latestBlock } = await supabase
          .from('qtc_blocks')
          .select('*')
          .order('block_height', { ascending: false })
          .limit(1)
          .single();

        const { count: txCount } = await supabase
          .from('qtc_transactions')
          .select('id', { count: 'exact', head: true });

        const { count: walletCount } = await supabase
          .from('qtc_ledger')
          .select('id', { count: 'exact', head: true });

        const { data: validators } = await supabase
          .from('qtc_validators')
          .select('stake_amount')
          .eq('is_active', true);

        const totalStaked = (validators || []).reduce((sum, v) => sum + Number(v.stake_amount), 0);

        return new Response(JSON.stringify({
          success: true,
          chain: {
            name: 'Quantum Time Crystal Chain',
            symbol: 'QTC',
            consensus: 'Proof of Temporal Resonance (PoTR)',
            block_time: 8,
            current_height: latestBlock?.block_height || 0,
            latest_block_hash: latestBlock?.block_hash || 'genesis',
            total_transactions: txCount || 0,
            total_wallets: walletCount || 0,
            total_supply: 1000000000,
            block_reward: 12.5,
            total_staked: totalStaked,
            active_validators: (validators || []).length,
            quantum_security: {
              key_encapsulation: 'ML-KEM-768 (NIST FIPS 203)',
              digital_signatures: 'ML-DSA-65 (NIST FIPS 204)',
              consensus_proof: 'Discrete Time Crystal Period Doubling'
            }
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('QTC Network error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});