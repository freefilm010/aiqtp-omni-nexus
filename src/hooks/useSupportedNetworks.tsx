import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SupportedChain {
  id: string;
  name: string;
  symbol: string;
  chain_type: string;
  rpc_url?: string | null;
  explorer_url?: string | null;
  logo_url?: string | null;
  is_evm_compatible: boolean | null;
  is_active: boolean | null;
  native_token_coingecko_id?: string | null;
  features: any;
}

export interface SupportedExchange {
  id: string;
  name: string;
  exchange_type: string;
  api_url?: string | null;
  websocket_url?: string | null;
  logo_url?: string | null;
  supported_chains: string[] | null;
  trading_pairs_count: number | null;
  is_active: boolean | null;
  requires_api_key: boolean | null;
  features: any;
}

export function useSupportedChains() {
  const [chains, setChains] = useState<SupportedChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChains = async () => {
      try {
        const { data, error } = await supabase
          .from('supported_chains')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setChains(data || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChains();
  }, []);

  const getChainsByType = (type: string) => chains.filter(c => c.chain_type === type);
  const getEvmChains = () => chains.filter(c => c.is_evm_compatible);
  const getPrivacyChains = () => chains.filter(c => c.chain_type === 'privacy');
  const getL2Chains = () => chains.filter(c => c.chain_type === 'layer2');

  return { chains, loading, error, getChainsByType, getEvmChains, getPrivacyChains, getL2Chains };
}

export function useSupportedExchanges() {
  const [exchanges, setExchanges] = useState<SupportedExchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExchanges = async () => {
      try {
        const { data, error } = await supabase
          .from('supported_exchanges')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setExchanges(data || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExchanges();
  }, []);

  const getCexExchanges = () => exchanges.filter(e => e.exchange_type === 'cex');
  const getDexExchanges = () => exchanges.filter(e => e.exchange_type === 'dex');
  const getExchangesByChain = (chainId: string) => 
    exchanges.filter(e => e.supported_chains.includes(chainId));

  return { exchanges, loading, error, getCexExchanges, getDexExchanges, getExchangesByChain };
}