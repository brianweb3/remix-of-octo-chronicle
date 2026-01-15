import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// CANONICAL wallet address
const WALLET_ADDRESS = "8ejAYL1hNeJreUxTfwUQ5QVay7dN5FCbaEiQspiciVxw";
const HELIUS_RPC = "https://mainnet.helius-rpc.com/?api-key=c5040336-825d-42e6-a592-59ef6633316c";
const MAX_HP = 720;
const LAMPORTS_PER_SOL = 1_000_000_000;

interface Transaction {
  signature: string;
  timestamp: number;
  amount: number; // in lamports
  sender: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { action } = await req.json();

    if (action === "check") {
      // Check for new transactions to the wallet
      const transactions = await fetchRecentTransactions();
      
      let totalHPAdded = 0;
      const newTransactions: Transaction[] = [];

      for (const tx of transactions) {
        // Check if transaction already processed
        const { data: existing } = await supabase
          .from("transaction_history")
          .select("id")
          .eq("tx_hash", tx.signature)
          .single();

        if (existing) continue; // Already processed

        // Calculate HP from SOL amount
        const amountSol = tx.amount / LAMPORTS_PER_SOL;
        const hpToAdd = Math.floor(amountSol / 0.01); // 0.01 SOL = 1 HP

        if (hpToAdd > 0) {
          // Record transaction
          await supabase.from("transaction_history").insert({
            tx_hash: tx.signature,
            amount_sol: amountSol,
            hp_added: hpToAdd,
            timestamp: new Date(tx.timestamp * 1000).toISOString(),
          });

          totalHPAdded += hpToAdd;
          newTransactions.push(tx);
        }
      }

      // Update HP if new donations received
      if (totalHPAdded > 0) {
        const { data: state } = await supabase
          .from("agent_state")
          .select("hp, is_dead")
          .single();

        if (state && !state.is_dead) {
          const newHP = Math.min(MAX_HP, state.hp + totalHPAdded);
          
          await supabase
            .from("agent_state")
            .update({ hp: newHP })
            .eq("id", 1);

          return new Response(
            JSON.stringify({
              success: true,
              hpAdded: totalHPAdded,
              newHP,
              transactions: newTransactions.length,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      return new Response(
        JSON.stringify({ success: true, hpAdded: 0, transactions: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "getState") {
      // Get current agent state
      const { data: state } = await supabase
        .from("agent_state")
        .select("*")
        .single();

      return new Response(
        JSON.stringify({ state }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "drain") {
      // Drain 1 HP (called every minute by cron)
      const { data: state } = await supabase
        .from("agent_state")
        .select("hp, is_dead")
        .single();

      if (state && !state.is_dead && state.hp > 0) {
        const newHP = state.hp - 1;
        const isDead = newHP <= 0;

        await supabase
          .from("agent_state")
          .update({ hp: Math.max(0, newHP), is_dead: isDead })
          .eq("id", 1);

        return new Response(
          JSON.stringify({ success: true, newHP: Math.max(0, newHP), isDead }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, reason: state?.is_dead ? "dead" : "no state" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("wallet-monitor error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function fetchRecentTransactions(): Promise<Transaction[]> {
  try {
    // Use Helius enhanced API to get transaction history
    const response = await fetch(HELIUS_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSignaturesForAddress",
        params: [
          WALLET_ADDRESS,
          { limit: 20 }
        ],
      }),
    });

    const data = await response.json();
    const signatures = data.result || [];

    const transactions: Transaction[] = [];

    // Get details for each transaction
    for (const sig of signatures) {
      try {
        const txResponse = await fetch(HELIUS_RPC, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getTransaction",
            params: [sig.signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }],
          }),
        });

        const txData = await txResponse.json();
        const tx = txData.result;

        if (tx && tx.meta && !tx.meta.err) {
          // Find SOL transfer to our wallet
          const preBalances = tx.meta.preBalances;
          const postBalances = tx.meta.postBalances;
          const accountKeys = tx.transaction.message.accountKeys;

          const walletIndex = accountKeys.findIndex(
            (key: { pubkey: string }) => key.pubkey === WALLET_ADDRESS
          );

          if (walletIndex !== -1) {
            const balanceChange = postBalances[walletIndex] - preBalances[walletIndex];
            
            if (balanceChange > 0) {
              // Find sender (first account that decreased balance)
              let sender = "unknown";
              for (let i = 0; i < accountKeys.length; i++) {
                if (postBalances[i] - preBalances[i] < 0) {
                  sender = accountKeys[i].pubkey;
                  break;
                }
              }

              transactions.push({
                signature: sig.signature,
                timestamp: tx.blockTime || Math.floor(Date.now() / 1000),
                amount: balanceChange,
                sender,
              });
            }
          }
        }
      } catch (txErr) {
        console.error("Error fetching transaction:", txErr);
      }
    }

    return transactions;
  } catch (e) {
    console.error("Error fetching transactions:", e);
    return [];
  }
}
