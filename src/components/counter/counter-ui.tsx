'use client'

import { PublicKey } from '@solana/web3.js'
import { useCrudProgram, useCrudProgramAccount } from './counter-data-access'
import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

export function CounterCreate() {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const { createEntry } = useCrudProgram()
  const { publicKey } = useWallet()

  const isFormValid = title.trim() !== "" && message.trim() !== ""

  const handleSubmit = () => {
    if (publicKey && isFormValid) {
      createEntry.mutateAsync({ title, message, owner: publicKey })
    }
  }

  if (!publicKey) {
    return <p> Connect Your Wallet.</p>
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="input input-boarded w-full max-w-xs"
      />
      <textarea
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="textarea textarea-boarded w-full max-w-xs"
      />
      <button
        onClick={handleSubmit}
        disabled={createEntry.isPending || !isFormValid}
        className="btn btn-xs lg:btn-md btn-primary"
      >
        Create {createEntry.isPending && '...'}
      </button>

      {/* <Button onClick={() => initialize.mutateAsync(Keypair.generate())} disabled={initialize.isPending}>
        Create {initialize.isPending && '...'}
      </Button> */}
    </div>
  )
}

export function CounterList() {
  const { accounts, getProgramAccount } = useCrudProgram()

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
      </div>
    )
  }
  return (
    <div className={'space-y-6'}>
      {accounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.data?.map((account) => (
            <CounterCard key={account.publicKey.toString()} account={account.publicKey} />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={'text-2xl'}>No accounts</h2>
          No accounts found. Create one above to get started.
        </div>
      )}
    </div>
  )
}

function CounterCard({ account }: { account: PublicKey }) {
  const { accountQuery, updateEntry, deleteEntry } = useCrudProgramAccount({
    account,
  })

  const title = accountQuery.data?.title
  const [message, setMessage] = useState("")
  const { publicKey } = useWallet()

  const isFormValid = message.trim() !== ""

  const handleSubmit = () => {
    if (publicKey && isFormValid && title) {
      updateEntry.mutateAsync({ title, message, owner: publicKey })
    }
  }

  if (!publicKey) {
    return <p> Connect Your Wallet.</p>
  }

  return accountQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className="card card-boarded border-base-300 border-4 text-neutral-content">
      <div className="card-body items-center text-center">
        <div className="cpave-y-6">
          <h2
            className="card-title justify-center text-3xl cursor-pointer"
            onClick={() => accountQuery.refetch()}
          >
            {accountQuery.data?.title}
          </h2>
          <p>{accountQuery.data?.message}</p>
          <div className="card-actions justify-around">
            <textarea
              placeholder="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="textarea textarea-boarded w-full max-w-xs"
            />
            <button
              onClick={handleSubmit}
              disabled={updateEntry.isPending || !isFormValid}
              className="btn btn-xs lg:btn-md btn-primary"
            >
              Update Journal Entry
            </button>
            <button
              onClick={() => {
                const title = accountQuery.data?.title
                if (title) {
                  return deleteEntry.mutateAsync(title)
                }
              }}
              disabled={deleteEntry.isPending}
              className="btn btn-xs lg:btn-md btn-error"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
 /* 
    <Button
      variant="outline"
      onClick={() => decrementMutation.mutateAsync()}
      disabled={decrementMutation.isPending}
    >
      Decrement
    </Button>
    <Button
      variant="destructive"
      onClick={() => {
        if (!window.confirm('Are you sure you want to close this account?')) {
          return
        }
        return closeMutation.mutateAsync()
      }}
      disabled={closeMutation.isPending}
    >
      Close
    </Button>
    </CardContent>
    </Card>
  */
}
