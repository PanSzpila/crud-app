'use client'

import { getCrudProgram, getCrudProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../use-transaction-toast'
import { toast } from 'sonner'

interface CreateEntryArgs {
  title: string;
  message: string;
  owner: PublicKey;

}

export function useCrudProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getCrudProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getCrudProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['journalEntry', 'all', { cluster }],
    queryFn: () => program.account.journalEntryState.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const createEntry = useMutation<string, Error, CreateEntryArgs> ({
    mutationKey: [`journalEntry`, `create`, { cluster }],
    mutationFn: async ({title, message, owner}) => {
      return program.methods.createJournalEntry(title, message).rpc();
    },
    onSuccess: (signature) {
      transactionToast(signature);
      accounts.refetch();
    },
    onError: (error) => {
      toast.error(`Error creating entry: ${error.message}`);
    }
  })

    const updateEntry = useMutation<string, Error, CreateEntryArgs> ({
    mutationKey: [`journalEntry`, `update`, { cluster }],
    mutationFn: async ({title, message}) => {
      return program.methods.updateJournalEntry(title, message).rpc();
    },
    onSuccess: (signature) {
      transactionToast(signature);
      accounts.refetch();
    },
    onError: (error) => {
      toast.error(`Error updating entry: ${error.message}`);
    }
  })

  const deleteEntry = useMutation({
    mutationKey: [`journalEntry`, `delete`, { cluster }],
    mutationFn: async ({title: string}) => {
      return program.methods.deleteJournalEntry(title).rpc();
    },
    onSuccess: (signature) {
      transactionToast(signature);
      accounts.refetch();
    },
  })

export function useCrudProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useCrudProgram()

  const accountQuery = useQuery({
    queryKey: ['journalEntry', 'fetch', { cluster, account }],
    queryFn: () => program.account.journalEntryState.fetch(account),
  })
  

  return {
    accountQuery,
    updateEntry,
    deleteEntry,
  }
}}
