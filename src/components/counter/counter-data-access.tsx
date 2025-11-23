'use client'

import { getCrudProgram, getCrudProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../use-transaction-toast'
import { toast } from 'sonner'

interface CreateEntryArgs {
  title: string
  message: string
  owner?: PublicKey
}

export function useCrudProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getCrudProgramId(cluster.network as Cluster), [cluster])

  const program = getCrudProgram(provider)

  const accounts = useQuery({
    queryKey: ['journalEntry', 'all', { cluster }],
    queryFn: async () => {
      // zakładamy, że program.account.journalEntryState.all() zwraca Promise
      return program.account.journalEntryState.all()
    },
    enabled: !!program,
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const createEntry = useMutation<string, Error, CreateEntryArgs>({
    mutationKey: ['journalEntry', 'create', { cluster }],
    mutationFn: async ({ title, message, owner }) => {
      const [journalEntryAddress] = await PublicKey.findProgramAddress(
        [Buffer.from(title), owner.toBuffer()],
        programId,
      )
      return program.methods.createJournalEntry(title, message).rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      accounts.refetch()
    },
    onError: (error: Error) => {
      toast.error(`Error creating entry: ${error.message}`)
    },
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    createEntry,
  }
}

export function useCrudProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useCrudProgram()
  const programId = new PublicKey('4ABSuyEZT7W7fn5byRCVipJ1beECs2DWLquBpez7Msd7')

  const accountQuery = useQuery({
    queryKey: ['journalEntry', 'fetch', { cluster, account }],
    queryFn: () => program.account.journalEntryState.fetch(account),
  })

  const updateEntry = useMutation<string, Error, CreateEntryArgs>({
    mutationKey: ['journalEntry', 'update', { cluster }],
    mutationFn: async ({ title, message, owner }) => {
      const [journalEntryAddress] = await PublicKey.findProgramAddress(
        [Buffer.from(title), owner.toBuffer()],
        programId,
      )
      return program.methods.updateJournalEntry(title, message).rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      accounts.refetch()
    },
    onError: (error: Error) => {
      toast.error(`Error updating entry: ${error.message}`)
    },
  })

  const deleteEntry = useMutation<string, Error, { title: string }>({
    mutationKey: ['journalEntry', 'deleteEntry', { cluster, account }],
    mutationFn: ({ title: string }) => program.methods.deleteJournalEntry(title).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accounts.refetch()
    },
    onError: (error: Error) => {
      toast.error(`Error deleting entry: ${error.message}`)
    },
  })

  return {
    accountQuery,
    updateEntry,
    deleteEntry,
  }
}
